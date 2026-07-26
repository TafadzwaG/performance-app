<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Controllers\OrganizationContextController;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\Setup\StoreAppraisalTemplateRequest;
use App\Http\Requests\Performance\Setup\UpdateAppraisalTemplateRequest;
use App\Models\AppraisalTemplate;
use App\Models\Organization;
use App\Services\Performance\AppraisalTemplateCloneService;
use App\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalTemplateController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalTemplateCloneService $cloneService,
    ) {
        $this->authorizeResource(AppraisalTemplate::class, 'template');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');
        $currentOrganizationId = app(TenantContext::class)->requireId();

        $templates = AppraisalTemplate::query()
            ->with(['department', 'jobTitle', 'objectiveRatingScale', 'competencyRatingScale', 'overallRatingScale'])
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $sourceOrganizationId = $request->integer('source_organization_id');
        $sharedTemplates = null;
        $selectedSourceOrganization = null;

        if (
            $sourceOrganizationId > 0
            && $sourceOrganizationId !== $currentOrganizationId
            && $this->cloneService->userCanAccessOrganization($request->user(), $sourceOrganizationId)
        ) {
            $selectedSourceOrganization = Organization::query()
                ->whereKey($sourceOrganizationId)
                ->where('status', 'active')
                ->first(['id', 'name', 'slug']);

            if ($selectedSourceOrganization) {
                $sharedTemplates = AppraisalTemplate::withoutGlobalScopes()
                    ->with(['department', 'jobTitle'])
                    ->where('organization_id', $sourceOrganizationId)
                    ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
                    ->orderByDesc('is_default')
                    ->orderBy('name')
                    ->paginate(10, ['*'], 'shared_page')
                    ->withQueryString();
            }
        }

        $sourceOrganizations = OrganizationContextController::availableOrganizationsFor($request->user())
            ->filter(fn (Organization $organization) => $organization->id !== $currentOrganizationId)
            ->map(fn (Organization $organization) => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
            ])
            ->values();

        return Inertia::render('performance/templates/Index', [
            'templates' => $templates,
            'sharedTemplates' => $sharedTemplates,
            'sourceOrganizations' => $sourceOrganizations,
            'selectedSourceOrganization' => $selectedSourceOrganization,
            'filters' => [
                'search' => $search,
                'source_organization_id' => $selectedSourceOrganization?->id,
            ],
            'can' => [
                'create' => $request->user()->can('performance.templates.create'),
                'import' => $request->user()->can('performance.templates.create'),
                'archive' => $request->user()->can('performance.templates.archive'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('performance/templates/Create', $this->formOptions());
    }

    public function store(StoreAppraisalTemplateRequest $request): RedirectResponse
    {
        $template = DB::transaction(function () use ($request) {
            $template = AppraisalTemplate::create($request->safe()->except('items') + [
                'version' => $request->integer('version') ?: 1,
                'allow_competencies' => (bool) $request->boolean('allow_competencies', true),
                'is_active' => (bool) $request->boolean('is_active', true),
            ]);

            $this->syncItems($template, $request->validated('items', []));

            return $template;
        });

        return to_route('performance.templates.builder', $template);
    }

    public function show(AppraisalTemplate $template): Response
    {
        $template->load([
            'department',
            'jobTitle',
            'objectiveRatingScale.levels',
            'competencyRatingScale.levels',
            'overallRatingScale.levels',
            'items.perspective',
            'items.competency',
        ]);

        return Inertia::render('performance/templates/Show', [
            'template' => $template,
        ]);
    }

    public function edit(AppraisalTemplate $template): Response
    {
        $template->load('items');

        return Inertia::render('performance/templates/Edit', [
            'template' => $template,
        ] + $this->formOptions());
    }

    public function builder(AppraisalTemplate $template): Response
    {
        $template->load([
            'department',
            'jobTitle',
            'objectiveRatingScale.levels',
            'competencyRatingScale.levels',
            'overallRatingScale.levels',
            'items.perspective',
            'items.competency',
        ]);

        return Inertia::render('performance/templates/Builder', [
            'template' => $template,
        ] + $this->formOptions());
    }

    public function update(UpdateAppraisalTemplateRequest $request, AppraisalTemplate $template): RedirectResponse
    {
        DB::transaction(function () use ($request, $template) {
            $template->update($request->safe()->except('items', 'template_id') + [
                'version' => $request->integer('version') ?: 1,
                'allow_competencies' => (bool) $request->boolean('allow_competencies'),
                'is_active' => (bool) $request->boolean('is_active'),
            ]);

            $template->items()->delete();
            $this->syncItems($template, $request->validated('items', []));
        });

        return to_route('performance.templates.builder', $template);
    }

    public function destroy(AppraisalTemplate $template): RedirectResponse
    {
        abort_if($template->is_protected, 403);

        $template->delete();

        return to_route('performance.templates.index');
    }

    private function formOptions(): array
    {
        return [
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'objectiveScaleOptions' => $this->ratingScaleOptions('objective'),
            'competencyScaleOptions' => $this->ratingScaleOptions('competency'),
            'overallScaleOptions' => $this->ratingScaleOptions('overall'),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'competencyOptions' => $this->competencyOptions(),
        ];
    }

    private function syncItems(AppraisalTemplate $template, array $items): void
    {
        foreach ($items as $item) {
            $template->items()->create([
                'item_type' => $item['item_type'],
                'perspective_id' => $item['perspective_id'] ?? null,
                'competency_id' => $item['competency_id'] ?? null,
                'title' => $item['title'],
                'description' => $item['description'] ?? null,
                'default_weight' => $item['default_weight'] ?? null,
                'evidence_source_hint' => $item['evidence_source_hint'] ?? null,
                'sort_order' => $item['sort_order'],
                'is_required' => (bool) ($item['is_required'] ?? false),
            ]);
        }
    }
}
