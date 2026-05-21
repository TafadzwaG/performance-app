<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Exports\Performance\GoalLibraryImportTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\ConfirmGoalLibraryImportRequest;
use App\Http\Requests\Performance\PreviewGoalLibraryImportRequest;
use App\Http\Requests\Performance\Setup\StoreGoalLibraryItemRequest;
use App\Http\Requests\Performance\Setup\UpdateGoalLibraryItemRequest;
use App\Models\GoalLibraryItem;
use App\Services\Performance\GoalLibraryImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GoalLibraryController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct()
    {
        $this->authorizeResource(GoalLibraryItem::class, 'goal_library_item');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $goalLibraryItems = GoalLibraryItem::query()
            ->with(['department', 'jobTitle', 'perspective'])
            ->when($search, fn ($query) => $query->where('title', 'like', "%{$search}%")->orWhere('kpi_measure', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/goal-library/Index', [
            'goalLibraryItems' => $goalLibraryItems,
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('performance.goal_library.create'),
                'import' => $request->user()->can('create', GoalLibraryItem::class),
            ],
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
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
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

        $this->assertImportMappingsComplete($session['preview'] ?? [], $request->validated());

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
        $rows = $goalLibraryImportService->parse($file, $perspectiveMappings, $departmentMappings, $jobTitleMappings);
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

    public function create(): Response
    {
        return Inertia::render('performance/goal-library/Create', [
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'perspectiveOptions' => $this->perspectiveOptions(),
        ]);
    }

    public function store(StoreGoalLibraryItemRequest $request): RedirectResponse
    {
        $goalLibraryItem = GoalLibraryItem::create($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        return to_route('performance.goal_library.show', $goalLibraryItem);
    }

    public function show(GoalLibraryItem $goalLibraryItem): Response
    {
        $goalLibraryItem->load(['department', 'jobTitle', 'perspective']);

        return Inertia::render('performance/goal-library/Show', [
            'goalLibraryItem' => $goalLibraryItem,
        ]);
    }

    public function edit(GoalLibraryItem $goalLibraryItem): Response
    {
        $goalLibraryItem->load(['department', 'jobTitle', 'perspective']);

        return Inertia::render('performance/goal-library/Edit', [
            'goalLibraryItem' => $goalLibraryItem,
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'perspectiveOptions' => $this->perspectiveOptions(),
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

    private function assertImportMappingsComplete(array $preview, array $validated): void
    {
        $perspectiveSources = collect($preview['perspectives'] ?? [])->pluck('source')->all();
        $departmentSources = collect($preview['departments'] ?? [])->pluck('source')->all();
        $jobTitleSources = collect($preview['job_titles'] ?? [])->pluck('source')->all();

        $mappedPerspectives = collect($validated['perspective_mappings'] ?? [])->pluck('source')->all();
        $mappedDepartments = collect($validated['department_mappings'] ?? [])->pluck('source')->all();
        $mappedJobTitles = collect($validated['job_title_mappings'] ?? [])->pluck('source')->all();

        $missingPerspectives = array_diff($perspectiveSources, $mappedPerspectives);
        $missingDepartments = array_diff($departmentSources, $mappedDepartments);
        $missingJobTitles = array_diff($jobTitleSources, $mappedJobTitles);

        if ($missingPerspectives !== [] || $missingDepartments !== [] || $missingJobTitles !== []) {
            throw ValidationException::withMessages([
                'perspective_mappings' => 'Complete all perspective, department, and job title mappings before importing.',
            ]);
        }
    }
}
