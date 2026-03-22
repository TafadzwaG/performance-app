<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\Setup\StoreGoalLibraryItemRequest;
use App\Http\Requests\Performance\Setup\UpdateGoalLibraryItemRequest;
use App\Models\GoalLibraryItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
            ],
        ]);
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
}
