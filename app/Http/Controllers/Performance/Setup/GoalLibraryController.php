<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Exports\Performance\GoalLibraryImportTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\ConfirmGoalLibraryImportRequest;
use App\Http\Requests\Performance\PreviewGoalLibraryImportRequest;
use App\Http\Requests\Performance\Setup\StoreGoalLibraryItemRequest;
use App\Http\Requests\Performance\Setup\UpdateGoalLibraryItemRequest;
use App\Http\Requests\Performance\Setup\UpdateGoalLibraryQuickUpdateRequest;
use App\Http\Requests\Performance\Setup\UpdateGoalLibraryWeightRequest;
use App\Models\Department;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Perspective;
use App\Models\User;
use App\Services\Performance\Export\GoalLibraryExportService;
use App\Services\Performance\GoalLibraryImportService;
use App\Services\Performance\GoalLibraryLookupService;
use App\Services\Performance\GoalLibraryScopeService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GoalLibraryController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly GoalLibraryScopeService $goalLibraryScope,
        private readonly GoalLibraryLookupService $goalLibraryLookup,
    ) {
        $this->authorizeResource(GoalLibraryItem::class, 'goal_library_item');
    }

    public function index(Request $request): Response
    {
        [$search, $departmentId, $jobTitleId, $perspectiveId] = $this->filterValues($request);

        $goalLibraryItems = $this->filteredGoalLibraryQuery($request)
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/goal-library/Index', [
            'goalLibraryItems' => $goalLibraryItems,
            'filters' => [
                'search' => $search,
                'department_id' => $departmentId ? (string) $departmentId : '',
                'job_title_id' => $jobTitleId ? (string) $jobTitleId : '',
                'perspective_id' => $perspectiveId ? (string) $perspectiveId : '',
            ],
            'departmentOptions' => $this->departmentOptionsFor($request->user()),
            'jobTitleOptions' => $this->jobTitleOptionsFor($request->user()),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'scope' => $this->goalLibraryScope->frontendContext($request->user()),
            'can' => [
                'create' => $request->user()->can('performance.goal_library.create'),
                'import' => $request->user()->can('create', GoalLibraryItem::class),
                'export' => $request->user()->can('viewAny', GoalLibraryItem::class),
                'archive' => $request->user()->can('performance.goal_library.archive'),
            ],
        ]);
    }

    public function export(Request $request, GoalLibraryExportService $goalLibraryExportService): BinaryFileResponse
    {
        $this->authorize('viewAny', GoalLibraryItem::class);

        [$search, $departmentId, $jobTitleId, $perspectiveId] = $this->filterValues($request);

        $rows = $this->filteredGoalLibraryQuery($request)
            ->latest()
            ->get();

        return $goalLibraryExportService->excel($rows, $request->user(), [
            'search' => $search !== '' ? $search : null,
            'department' => $departmentId ? Department::query()->find($departmentId)?->name : null,
            'job_title' => $jobTitleId ? JobTitle::query()->find($jobTitleId)?->name : null,
            'perspective' => $perspectiveId ? Perspective::query()->find($perspectiveId)?->name : null,
        ]);
    }

    public function uploadCreate(Request $request): Response
    {
        $this->authorize('create', GoalLibraryItem::class);

        return Inertia::render('performance/goal-library/Upload');
    }

    public function uploadPreview(PreviewGoalLibraryImportRequest $request, GoalLibraryImportService $goalLibraryImportService): Response
    {
        $this->authorize('create', GoalLibraryItem::class);

        $file = $request->file('file');
        $preview = $goalLibraryImportService->preview($file);

        $request->session()->put(GoalLibraryImportService::SESSION_KEY, [
            'path' => $goalLibraryImportService->storeUploadForSession($file),
            'original_name' => $file->getClientOriginalName(),
            'preview' => $preview,
        ]);

        return Inertia::render('performance/goal-library/UploadPreview', [
            'preview' => $preview,
            'perspectiveOptions' => $this->perspectiveOptions(),
            'departmentOptions' => $this->departmentOptionsFor($request->user()),
            'jobTitleOptions' => $this->jobTitleOptionsFor($request->user()),
            'scope' => $this->goalLibraryScope->frontendContext($request->user()),
        ]);
    }

    public function uploadStore(ConfirmGoalLibraryImportRequest $request, GoalLibraryImportService $goalLibraryImportService): RedirectResponse
    {
        $this->authorize('create', GoalLibraryItem::class);

        $session = $request->session()->get(GoalLibraryImportService::SESSION_KEY);

        if (! is_array($session) || ! isset($session['path'])) {
            return to_route('performance.goal_library.upload')
                ->withErrors(['file' => 'Upload session expired. Please upload your file again.']);
        }

        $this->assertImportMappingsComplete($session['preview'] ?? [], $request->validated(), $request->user());

        $perspectiveMappings = collect($request->validated('perspective_mappings'))
            ->mapWithKeys(fn (array $item) => [$item['source'] => (string) $item['perspective_id']])
            ->all();
        $departmentMappings = collect($request->validated('department_mappings') ?? [])
            ->mapWithKeys(fn (array $item) => [$item['source'] => (string) ($item['department_id'] ?? '')])
            ->all();
        $jobTitleMappings = collect($request->validated('job_title_mappings') ?? [])
            ->mapWithKeys(fn (array $item) => [$item['source'] => (string) ($item['job_title_id'] ?? '')])
            ->all();

        $file = $goalLibraryImportService->uploadedFileFromSession($session);
        $rows = $goalLibraryImportService->parse(
            $file,
            $perspectiveMappings,
            $departmentMappings,
            $jobTitleMappings,
            $request->user(),
        );
        $count = $goalLibraryImportService->import($rows);

        $goalLibraryImportService->clearSessionUpload($session);
        $request->session()->forget(GoalLibraryImportService::SESSION_KEY);

        return to_route('performance.goal_library.index')
            ->with('success', "{$count} goal library items imported successfully.");
    }

    public function downloadUploadTemplate(GoalLibraryImportTemplateExport $export): BinaryFileResponse
    {
        $this->authorize('create', GoalLibraryItem::class);

        return $export->download('goal-library-upload-template-'.now()->format('Ymd-Hi').'.xlsx');
    }

    public function create(Request $request): Response
    {
        return Inertia::render('performance/goal-library/Create', [
            'departmentOptions' => $this->departmentOptionsFor($request->user()),
            'jobTitleOptions' => $this->jobTitleOptionsFor($request->user()),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'scope' => $this->goalLibraryScope->frontendContext($request->user()),
        ]);
    }

    public function store(StoreGoalLibraryItemRequest $request): RedirectResponse|JsonResponse
    {
        $goalLibraryItem = GoalLibraryItem::create($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'item' => $this->formatGoalLibraryItemForJson($goalLibraryItem->load('perspective:id,name')),
            ], 201);
        }

        return to_route('performance.goal_library.show', $goalLibraryItem);
    }

    public function show(GoalLibraryItem $goalLibraryItem): Response
    {
        $goalLibraryItem->load(['department', 'jobTitle', 'perspective']);

        return Inertia::render('performance/goal-library/Show', [
            'goalLibraryItem' => $goalLibraryItem,
        ]);
    }

    public function edit(Request $request, GoalLibraryItem $goalLibraryItem): Response
    {
        $goalLibraryItem->load(['department', 'jobTitle', 'perspective']);

        return Inertia::render('performance/goal-library/Edit', [
            'goalLibraryItem' => $goalLibraryItem,
            'departmentOptions' => $this->departmentOptionsFor($request->user()),
            'jobTitleOptions' => $this->jobTitleOptionsFor($request->user()),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'scope' => $this->goalLibraryScope->frontendContext($request->user()),
        ]);
    }

    public function update(UpdateGoalLibraryItemRequest $request, GoalLibraryItem $goalLibraryItem): RedirectResponse
    {
        $goalLibraryItem->update($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active'),
        ]);

        return to_route('performance.goal_library.show', $goalLibraryItem);
    }

    public function destroy(GoalLibraryItem $goalLibraryItem): RedirectResponse
    {
        $goalLibraryItem->delete();

        return to_route('performance.goal_library.index');
    }

    public function updateWeight(UpdateGoalLibraryWeightRequest $request, GoalLibraryItem $goalLibraryItem): JsonResponse
    {
        $this->authorize('update', $goalLibraryItem);

        $goalLibraryItem->update([
            'default_weight' => $request->validated('default_weight'),
        ]);

        return response()->json([
            'id' => $goalLibraryItem->id,
            'default_weight' => (float) $goalLibraryItem->default_weight,
        ]);
    }

    public function deactivate(GoalLibraryItem $goalLibraryItem): JsonResponse
    {
        $this->authorize('delete', $goalLibraryItem);

        $goalLibraryItem->update(['is_active' => false]);

        return response()->json([
            'id' => $goalLibraryItem->id,
            'is_active' => false,
        ]);
    }

    public function quickUpdate(UpdateGoalLibraryQuickUpdateRequest $request, GoalLibraryItem $goalLibraryItem): JsonResponse
    {
        $this->authorize('update', $goalLibraryItem);

        $goalLibraryItem->update($request->validated());

        return response()->json([
            'item' => $this->formatGoalLibraryItemForJson($goalLibraryItem->load('perspective:id,name')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatGoalLibraryItemForJson(GoalLibraryItem $goalLibraryItem): array
    {
        return [
            'id' => $goalLibraryItem->id,
            'title' => $goalLibraryItem->title,
            'description' => $goalLibraryItem->description,
            'default_weight' => (float) $goalLibraryItem->default_weight,
            'perspective_id' => $goalLibraryItem->perspective_id,
            'perspective_name' => $goalLibraryItem->perspective?->name,
            'kpi_measure' => $goalLibraryItem->kpi_measure,
        ];
    }

    private function filterValues(Request $request): array
    {
        $search = (string) $request->string('search');
        $departmentId = $request->integer('department_id') ?: null;
        $jobTitleId = $request->integer('job_title_id') ?: null;
        $perspectiveId = $request->integer('perspective_id') ?: null;

        if ($this->goalLibraryScope->appliesTo($request->user())) {
            $scope = $this->goalLibraryScope->profileScope($request->user());
            $departmentId = $scope['department_id'] ?? null;
            // Job title matching is handled inside scopeQuery (includes department-wide goals).
            $jobTitleId = null;
        }

        return [
            $search,
            $departmentId,
            $jobTitleId,
            $perspectiveId,
        ];
    }

    private function filteredGoalLibraryQuery(Request $request): Builder
    {
        [$search, $departmentId, $jobTitleId, $perspectiveId] = $this->filterValues($request);
        $user = $request->user();

        $query = GoalLibraryItem::query()
            ->with(['department', 'jobTitle', 'perspective']);

        if ($this->goalLibraryScope->appliesTo($user)) {
            $this->goalLibraryScope->applyEmployeeCatalogScope($query, $user);
        } else {
            $query
                ->when($departmentId, fn (Builder $builder) => $builder->where('department_id', $departmentId))
                ->when($jobTitleId, fn (Builder $builder) => $builder->where('job_title_id', $jobTitleId));
        }

        return $this->goalLibraryLookup
            ->applySearch($query, $search)
            ->when($perspectiveId, fn (Builder $builder) => $builder->where('perspective_id', $perspectiveId));
    }

    /**
     * @return list<array{value:int|string,label:string}>
     */
    private function departmentOptionsFor(User $user): array
    {
        $context = $this->goalLibraryScope->frontendContext($user);

        if (! $context['locked'] || ! $context['department_id']) {
            return $this->departmentOptions();
        }

        return [[
            'value' => $context['department_id'],
            'label' => $context['department_label'] ?? 'Department',
        ]];
    }

    /**
     * @return list<array{value:int|string,label:string}>
     */
    private function jobTitleOptionsFor(User $user): array
    {
        $context = $this->goalLibraryScope->frontendContext($user);

        if (! $context['locked'] || ! $context['job_title_id']) {
            return $this->jobTitleOptions();
        }

        return [[
            'value' => $context['job_title_id'],
            'label' => $context['job_title_label'] ?? 'Job title',
        ]];
    }

    private function assertImportMappingsComplete(array $preview, array $validated, User $user): void
    {
        $perspectiveSources = collect($preview['perspectives'] ?? [])->pluck('source')->all();
        $departmentSources = collect($preview['departments'] ?? [])->pluck('source')->all();
        $jobTitleSources = collect($preview['job_titles'] ?? [])->pluck('source')->all();

        $mappedPerspectives = collect($validated['perspective_mappings'] ?? [])->pluck('source')->all();
        $mappedDepartments = collect($validated['department_mappings'] ?? [])->pluck('source')->all();
        $mappedJobTitles = collect($validated['job_title_mappings'] ?? [])->pluck('source')->all();

        $missingPerspectives = array_diff($perspectiveSources, $mappedPerspectives);

        if ($missingPerspectives !== []) {
            throw ValidationException::withMessages([
                'perspective_mappings' => 'Complete all perspective mappings before importing.',
            ]);
        }

        if ($this->goalLibraryScope->appliesTo($user)) {
            return;
        }

        $missingDepartments = array_diff($departmentSources, $mappedDepartments);
        $missingJobTitles = array_diff($jobTitleSources, $mappedJobTitles);

        if ($missingDepartments !== [] || $missingJobTitles !== []) {
            throw ValidationException::withMessages([
                'department_mappings' => 'Complete all department and job title mappings before importing.',
            ]);
        }
    }
}
