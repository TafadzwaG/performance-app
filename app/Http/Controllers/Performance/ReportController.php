<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Services\Performance\ReportQueryService;
use App\Support\Tenancy\TenantRule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly ReportQueryService $reportQueryService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorizeReports($request);

        return Inertia::render('performance/reports/Index', [
            'reviewCycleOptions' => $this->reviewCycleOptions(),
            'locationOptions' => $this->locationOptions(),
            'filters' => $this->filters($request),
            'reports' => $this->reportQueryService->comprehensiveReports($this->filters($request)),
        ]);
    }

    public function cycleSummary(Request $request): Response
    {
        $this->authorizeReports($request);

        return Inertia::render('performance/reports/CycleSummary', [
            'rows' => $this->reportQueryService->cycleSummary($this->filters($request)),
            'reviewCycleOptions' => $this->reviewCycleOptions(),
            'filters' => $this->filters($request),
        ]);
    }

    public function departmentSummary(Request $request): Response
    {
        $this->authorizeReports($request);

        return Inertia::render('performance/reports/DepartmentSummary', [
            'rows' => $this->reportQueryService->departmentSummary($this->filters($request)),
            'reviewCycleOptions' => $this->reviewCycleOptions(),
            'filters' => $this->filters($request),
        ]);
    }

    public function employeeSummary(Request $request): Response
    {
        $this->authorizeReports($request);

        return Inertia::render('performance/reports/EmployeeSummary', [
            'rows' => $this->reportQueryService->employeeSummary($this->filters($request)),
            'reviewCycleOptions' => $this->reviewCycleOptions(),
            'filters' => $this->filters($request),
        ]);
    }

    public function completionStatus(Request $request): Response
    {
        $this->authorizeReports($request);

        return Inertia::render('performance/reports/CompletionStatus', [
            'rows' => $this->reportQueryService->completionStatus($this->filters($request)),
            'reviewCycleOptions' => $this->reviewCycleOptions(),
            'filters' => $this->filters($request),
        ]);
    }

    public function ratingDistribution(Request $request): Response
    {
        $this->authorizeReports($request);

        return Inertia::render('performance/reports/RatingDistribution', [
            'rows' => $this->reportQueryService->ratingDistribution($this->filters($request)),
            'reviewCycleOptions' => $this->reviewCycleOptions(),
            'filters' => $this->filters($request),
        ]);
    }

    public function overdueReviews(Request $request): Response
    {
        $this->authorizeReports($request);

        return Inertia::render('performance/reports/OverdueReviews', [
            'rows' => $this->reportQueryService->overdueReviews($this->filters($request)),
            'reviewCycleOptions' => $this->reviewCycleOptions(),
            'filters' => $this->filters($request),
        ]);
    }

    private function authorizeReports(Request $request): void
    {
        abort_unless($request->user()->can('performance.reports.view'), 403);
    }

    private function filters(Request $request): array
    {
        $validated = $request->validate([
            'review_cycle_id' => ['nullable', 'integer', TenantRule::exists('review_cycles')],
            'location_id' => ['nullable', 'integer', TenantRule::visibleLocation()],
        ]);

        return [
            'review_cycle_id' => filled($validated['review_cycle_id'] ?? null) ? (int) $validated['review_cycle_id'] : null,
            'location_id' => filled($validated['location_id'] ?? null) ? (int) $validated['location_id'] : null,
        ];
    }
}
