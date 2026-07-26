<?php

namespace App\Http\Controllers\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\StoreReviewCycleRequest;
use App\Http\Requests\Performance\UpdateReviewCycleRequest;
use App\Models\ReviewCycle;
use App\Services\Performance\ReviewCycleAutomationService;
use App\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReviewCycleController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly ReviewCycleAutomationService $automationService,
        private readonly TenantContext $tenantContext,
    ) {
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
                'delete' => $request->user()->can('performance.review_cycles.update'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('performance/review-cycles/Create', [
            'templateOptions' => $this->templateOptions(),
        ]);
    }

    public function store(StoreReviewCycleRequest $request): RedirectResponse
    {
        $reviewCycle = ReviewCycle::create($request->safe()->except(['status']) + [
            'status' => ReviewCycleStatus::Draft->value,
        ]);

        return to_route('performance.review_cycles.show', $reviewCycle);
    }

    public function show(Request $request, ReviewCycle $reviewCycle): Response
    {
        $reviewCycle->load('template')->loadCount('appraisals');
        $existingCounts = DB::table('appraisals')
            ->where('review_cycle_id', $reviewCycle->id)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn (mixed $total): int => (int) $total)
            ->all();

        $statusCounts = collect(AppraisalStatus::cases())
            ->mapWithKeys(fn (AppraisalStatus $status) => [$status->value => 0])
            ->merge($existingCounts)
            ->all();

        $canOpen = $request->user()->can('performance.review_cycles.open')
            && $request->user()->can('update', $reviewCycle)
            && $this->hasTenantWideAccess($request);
        $canSync = $request->user()->can('performance.review_cycles.assign_employees')
            && $request->user()->can('update', $reviewCycle)
            && $this->hasTenantWideAccess($request);

        return Inertia::render('performance/review-cycles/Show', [
            'reviewCycle' => $reviewCycle,
            'statusCounts' => $statusCounts,
            'automationReadiness' => ($canOpen || $canSync) && $reviewCycle->status !== ReviewCycleStatus::Closed
                ? $this->automationService->readiness($reviewCycle)
                : null,
            'perspectiveOptions' => ($canOpen || $canSync) && $reviewCycle->status !== ReviewCycleStatus::Closed
                ? $this->perspectiveOptions()
                : [],
            'templateOptions' => $this->templateOptions(),
            'employeeProfileOptions' => $request->user()->can('performance.review_cycles.assign_employees')
                ? $this->employeeProfileOptions()
                : [],
            'can' => [
                'assignEmployees' => $request->user()->can('performance.review_cycles.assign_employees'),
                'open' => $canOpen,
                'sync' => $canSync,
            ],
        ]);
    }

    public function edit(ReviewCycle $reviewCycle): Response
    {
        return Inertia::render('performance/review-cycles/Edit', [
            'reviewCycle' => $reviewCycle->loadCount('appraisals'),
            'templateOptions' => $this->templateOptions(),
        ]);
    }

    public function update(UpdateReviewCycleRequest $request, ReviewCycle $reviewCycle): RedirectResponse
    {
        $attributes = collect($request->safe()->except(['status']))->all();

        $reviewCycle->update($attributes);

        return to_route('performance.review_cycles.show', $reviewCycle);
    }

    public function destroy(ReviewCycle $reviewCycle): RedirectResponse
    {
        $appraisalCount = $reviewCycle->appraisals()->withTrashed()->count();

        DB::transaction(function () use ($reviewCycle): void {
            $reviewCycle->delete();
        });

        return to_route('performance.review_cycles.index')->with(
            'success',
            sprintf(
                'Review cycle deleted along with %d appraisal%s.',
                $appraisalCount,
                $appraisalCount === 1 ? '' : 's',
            ),
        );
    }

    public function open(Request $request, ReviewCycle $reviewCycle): RedirectResponse
    {
        abort_unless($request->user()->can('performance.review_cycles.open'), 403);
        $this->authorize('update', $reviewCycle);
        $this->authorizeTenantWideAccess($request);

        $this->automationService->open($reviewCycle, $request->user());

        return to_route('performance.review_cycles.show', $reviewCycle)
            ->with('success', 'Review cycle opened. Eligible employees can now start their self assessments.');
    }

    public function readiness(Request $request, ReviewCycle $reviewCycle): JsonResponse
    {
        $this->authorize('update', $reviewCycle);
        abort_unless(
            $request->user()->can('performance.review_cycles.open')
            || $request->user()->can('performance.review_cycles.assign_employees'),
            403,
        );
        $this->authorizeTenantWideAccess($request);

        return response()->json($this->automationService->readiness($reviewCycle));
    }

    public function sync(Request $request, ReviewCycle $reviewCycle): RedirectResponse
    {
        $this->authorize('update', $reviewCycle);
        abort_unless($request->user()->can('performance.review_cycles.assign_employees'), 403);
        $this->authorizeTenantWideAccess($request);

        $result = $this->automationService->sync($reviewCycle, $request->user());

        return to_route('performance.review_cycles.show', $reviewCycle)
            ->with('success', "Synchronized {$result['created']} newly eligible employee appraisal(s).");
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

    private function hasTenantWideAccess(Request $request): bool
    {
        return $this->tenantContext->allowedLocationIds($request->user()) === null;
    }

    private function authorizeTenantWideAccess(Request $request): void
    {
        abort_unless($this->hasTenantWideAccess($request), 403, 'All-location organization access is required for this action.');
    }
}
