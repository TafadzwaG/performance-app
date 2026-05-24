<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\Setup\StoreGoalLibraryItemRequest;
use App\Http\Requests\Performance\Setup\UpdateGoalLibraryItemRequest;
use App\Models\GoalLibraryItem;
use App\Models\User;
use App\Services\Performance\GoalLibraryLookupService;
use App\Services\Performance\GoalLibraryScopeService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyKpisController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly GoalLibraryScopeService $goalLibraryScope,
        private readonly GoalLibraryLookupService $goalLibraryLookup,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('performance.goal_library.view')
            || $user->can('performance.appraisals.view_own')
            || $user->can('performance.dashboard.view'),
            403,
        );

        $search = (string) $request->string('search');
        $departmentId = $request->integer('department_id') ?: null;
        $jobTitleId = $request->integer('job_title_id') ?: null;
        $perspectiveId = $request->integer('perspective_id') ?: null;

        if ($this->goalLibraryScope->appliesTo($user)) {
            $departmentId = null;
            $jobTitleId = null;
        }

        $goalLibraryItems = $this->scopedQuery($user, $search, $departmentId, $jobTitleId, $perspectiveId)
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('performance/my-kpis/Index', [
            'goalLibraryItems' => $goalLibraryItems,
            'filters' => [
                'search' => $search,
                'department_id' => $departmentId ? (string) $departmentId : '',
                'job_title_id' => $jobTitleId ? (string) $jobTitleId : '',
                'perspective_id' => $perspectiveId ? (string) $perspectiveId : '',
            ],
            'departmentOptions' => $this->departmentOptionsFor($user),
            'jobTitleOptions' => $this->jobTitleOptionsFor($user),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'scope' => $this->goalLibraryScope->frontendContext($user),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();

        $this->authorizeMyKpisCreate($user);

        return Inertia::render('performance/goal-library/Create', [
            'departmentOptions' => $this->departmentOptionsFor($user),
            'jobTitleOptions' => $this->jobTitleOptionsFor($user),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'scope' => $this->goalLibraryScope->frontendContext($user),
            'formAction' => route('performance.my_kpis.store'),
            'indexHref' => route('performance.my_kpis.index'),
            'pageTitle' => 'Add KPI',
            'pageDescription' => 'Add a KPI for your department and job title.',
        ]);
    }

    public function store(StoreGoalLibraryItemRequest $request): RedirectResponse
    {
        $this->authorizeMyKpisCreate($request->user());

        GoalLibraryItem::create($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        return to_route('performance.my_kpis.index')
            ->with('success', 'KPI added successfully.');
    }

    public function edit(Request $request, GoalLibraryItem $goalLibraryItem): Response
    {
        $user = $request->user();

        $this->authorizeMyKpisItem($user, $goalLibraryItem);
        $goalLibraryItem->load(['department', 'jobTitle', 'perspective']);

        return Inertia::render('performance/goal-library/Edit', [
            'goalLibraryItem' => $goalLibraryItem,
            'departmentOptions' => $this->departmentOptionsFor($user),
            'jobTitleOptions' => $this->jobTitleOptionsFor($user),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'scope' => $this->goalLibraryScope->frontendContext($user),
            'formAction' => route('performance.my_kpis.update', $goalLibraryItem),
            'indexHref' => route('performance.my_kpis.index'),
            'pageTitle' => 'Edit KPI',
            'pageDescription' => 'Update a KPI for your department and job title.',
        ]);
    }

    public function update(UpdateGoalLibraryItemRequest $request, GoalLibraryItem $goalLibraryItem): RedirectResponse
    {
        $this->authorizeMyKpisItem($request->user(), $goalLibraryItem);

        $goalLibraryItem->update($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active'),
        ]);

        return to_route('performance.my_kpis.index')
            ->with('success', 'KPI updated successfully.');
    }

    private function scopedQuery(User $user, string $search, ?int $departmentId, ?int $jobTitleId, ?int $perspectiveId): Builder
    {
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

    private function authorizeMyKpisCreate(?User $user): void
    {
        abort_unless(
            $user !== null,
            403,
        );
    }

    private function authorizeMyKpisItem(?User $user, GoalLibraryItem $goalLibraryItem): void
    {
        abort_unless(
            $user !== null
            && $this->goalLibraryScope->itemAccessible($user, $goalLibraryItem),
            403,
        );
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
}
