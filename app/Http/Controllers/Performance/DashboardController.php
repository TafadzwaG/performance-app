<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Services\Performance\DashboardGoalSettingCoverageService;
use App\Services\Performance\DashboardGoalsViewService;
use App\Services\Performance\ReportQueryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ReportQueryService $reportQueryService,
        private readonly DashboardGoalsViewService $goalsViewService,
        private readonly DashboardGoalSettingCoverageService $goalSettingCoverageService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $dashboard = $this->reportQueryService->dashboard($request->user());

        $myAppraisals = $request->user()
            ->employeeProfile?->appraisals()
            ->with('reviewCycle')
            ->latest('updated_at')
            ->limit(6)
            ->get() ?? collect();

        $teamAppraisals = $request->user()
            ->managedEmployeeProfiles()
            ->with(['appraisals' => fn ($query) => $query->with('reviewCycle')->where('status', 'manager_review_pending')->latest('updated_at')])
            ->get()
            ->pluck('appraisals')
            ->flatten()
            ->take(6)
            ->values();

        $approvalQueue = $request->user()
            ->approvingEmployeeProfiles()
            ->with(['appraisals' => fn ($query) => $query->with('reviewCycle')->where('status', 'approval_pending')->latest('updated_at')])
            ->get()
            ->pluck('appraisals')
            ->flatten()
            ->take(6)
            ->values();

        $overdueQueue = $this->reportQueryService
            ->overdueReviews(user: $request->user())
            ->load('reviewCycle')
            ->take(6)
            ->values();

        return Inertia::render('performance/dashboard/Index', [
            'dashboard' => $dashboard,
            'myAppraisals' => $myAppraisals,
            'teamPending' => $teamAppraisals,
            'approvalQueue' => $approvalQueue,
            'overdueQueue' => $overdueQueue,
            'currentGoals' => $this->goalsViewService->currentGoalsFor($request->user()),
            'myScoreSummary' => $this->goalsViewService->latestScoreSummaryFor($request->user()),
            'assignedGoalCycles' => $this->goalsViewService->assignedGoalCycles($request->user()),
            'goalsLookupEndpoint' => route('performance.dashboard.goals.lookup'),
            'goalSettingCoverage' => $request->user()->can('performance.goal_library.view')
                || $request->user()->can('performance.review_cycles.view')
                ? $this->goalSettingCoverageService->report()
                : null,
        ]);
    }
}
