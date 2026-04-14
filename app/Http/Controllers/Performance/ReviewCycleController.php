<?php

namespace App\Http\Controllers\Performance;

use App\Enums\ReviewCycleStatus;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\StoreReviewCycleRequest;
use App\Http\Requests\Performance\UpdateReviewCycleRequest;
use App\Models\ReviewCycle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewCycleController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct()
    {
        $this->authorizeResource(ReviewCycle::class, 'review_cycle');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $reviewCycles = ReviewCycle::query()
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
            ->withCount('appraisals')
            ->latest('start_date')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/review-cycles/Index', [
            'reviewCycles' => $reviewCycles,
            'filters' => ['search' => $search],
            'employeeProfileOptions' => $request->user()->can('performance.review_cycles.assign_employees')
                ? $this->employeeProfileOptions()
                : [],
            'templateOptions' => $request->user()->can('performance.review_cycles.assign_employees')
                ? $this->templateOptions()
                : [],
            'can' => [
                'create' => $request->user()->can('performance.review_cycles.create'),
                'assignEmployees' => $request->user()->can('performance.review_cycles.assign_employees'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('performance/review-cycles/Create');
    }

    public function store(StoreReviewCycleRequest $request): RedirectResponse
    {
        $reviewCycle = ReviewCycle::create($request->validated() + [
            'status' => $request->input('status', ReviewCycleStatus::Draft->value),
        ]);

        return to_route('performance.review_cycles.show', $reviewCycle);
    }

    public function show(Request $request, ReviewCycle $reviewCycle): Response
    {
        $reviewCycle->loadCount('appraisals');
        $statusCounts = $reviewCycle->appraisals()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('performance/review-cycles/Show', [
            'reviewCycle' => $reviewCycle,
            'statusCounts' => $statusCounts,
            'templateOptions' => $this->templateOptions(),
            'employeeProfileOptions' => $request->user()->can('performance.review_cycles.assign_employees')
                ? $this->employeeProfileOptions()
                : [],
            'can' => [
                'assignEmployees' => $request->user()->can('performance.review_cycles.assign_employees'),
            ],
        ]);
    }

    public function edit(ReviewCycle $reviewCycle): Response
    {
        return Inertia::render('performance/review-cycles/Edit', [
            'reviewCycle' => $reviewCycle,
        ]);
    }

    public function update(UpdateReviewCycleRequest $request, ReviewCycle $reviewCycle): RedirectResponse
    {
        $attributes = $request->validated();

        if (($attributes['status'] ?? null) === ReviewCycleStatus::Open->value && !$reviewCycle->opened_at) {
            $attributes['opened_at'] = now();
        }

        if (($attributes['status'] ?? null) === ReviewCycleStatus::Closed->value) {
            $attributes['closed_at'] = now();
        }

        $reviewCycle->update($attributes);

        return to_route('performance.review_cycles.show', $reviewCycle);
    }

    public function open(Request $request, ReviewCycle $reviewCycle): RedirectResponse
    {
        abort_unless($request->user()->can('performance.review_cycles.open'), 403);
        $this->authorize('update', $reviewCycle);

        $reviewCycle->update([
            'status' => ReviewCycleStatus::Open,
            'opened_at' => now(),
        ]);

        return to_route('performance.review_cycles.show', $reviewCycle);
    }

    public function close(Request $request, ReviewCycle $reviewCycle): RedirectResponse
    {
        abort_unless($request->user()->can('performance.review_cycles.close'), 403);
        $this->authorize('update', $reviewCycle);

        $reviewCycle->update([
            'status' => ReviewCycleStatus::Closed,
            'closed_at' => now(),
        ]);

        return to_route('performance.review_cycles.show', $reviewCycle);
    }
}
