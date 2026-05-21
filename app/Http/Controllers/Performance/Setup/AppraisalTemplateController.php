<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\Setup\StoreAppraisalTemplateRequest;
use App\Http\Requests\Performance\Setup\UpdateAppraisalTemplateRequest;
use App\Models\AppraisalTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalTemplateController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct()
    {
        $this->authorizeResource(AppraisalTemplate::class, 'template');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $templates = AppraisalTemplate::query()
            ->with(['department', 'jobTitle', 'objectiveRatingScale', 'competencyRatingScale', 'overallRatingScale'])
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/templates/Index', [
            'templates' => $templates,
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('performance.templates.create'),
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
