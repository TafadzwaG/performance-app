<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Services\Performance\ReportQueryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ReportQueryService $reportQueryService,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $metrics = $this->reportQueryService->dashboard($request->user());

        $myAppraisals = $request->user()
            ->employeeProfile?->appraisals()
            ->with('reviewCycle')
            ->latest('updated_at')
            ->limit(5)
            ->get() ?? collect();

        $teamAppraisals = $request->user()
            ->managedEmployeeProfiles()
            ->with(['appraisals' => fn ($query) => $query->where('status', 'manager_review_pending')->latest('updated_at')])
            ->get()
            ->pluck('appraisals')
            ->flatten()
            ->take(5)
            ->values();

        return Inertia::render('performance/dashboard/Index', [
            'metrics' => $metrics,
            'myAppraisals' => $myAppraisals,
            'teamPending' => $teamAppraisals,
        ]);
    }
}
