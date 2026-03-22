<?php

namespace App\Http\Controllers\Performance;

use App\Exports\Performance\CompletionStatusExport;
use App\Exports\Performance\CycleSummaryExport;
use App\Exports\Performance\DepartmentSummaryExport;
use App\Exports\Performance\EmployeeSummaryExport;
use App\Exports\Performance\OverdueReviewsExport;
use App\Exports\Performance\RatingDistributionExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\ExportReportRequest;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use App\Services\Performance\ReportQueryService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportExportController extends Controller
{
    public function __construct(
        private readonly ReportQueryService $reportQueryService,
    ) {
    }

    public function export(ExportReportRequest $request, string $report): BinaryFileResponse
    {
        abort_unless($request->user()->can('performance.reports.export'), 403);

        $filters = $request->validated();

        return match ($report) {
            'cycle-summary' => (new CycleSummaryExport($this->reportQueryService->cycleSummary($filters)))
                ->download($this->cycleFilename($request)),
            'department-summary' => (new DepartmentSummaryExport($this->reportQueryService->departmentSummary($filters)))
                ->download($this->departmentFilename($request)),
            'employee-summary' => (new EmployeeSummaryExport($this->reportQueryService->employeeSummary($filters)))
                ->download($this->employeeFilename($request)),
            'completion-status' => (new CompletionStatusExport($this->reportQueryService->completionStatus($filters)))
                ->download('completion-status-'.$this->timestamp().'.xlsx'),
            'rating-distribution' => (new RatingDistributionExport($this->reportQueryService->ratingDistribution($filters)))
                ->download('rating-distribution-'.$this->timestamp().'.xlsx'),
            'overdue-reviews' => (new OverdueReviewsExport($this->reportQueryService->overdueReviews($filters)->load(['lineManager', 'approvingManager'])))
                ->download('overdue-reviews-'.$this->timestamp().'.xlsx'),
            default => abort(404),
        };
    }

    private function cycleFilename(Request $request): string
    {
        $cycleCode = ReviewCycle::query()->find($request->integer('review_cycle_id'))?->code ?? 'all-cycles';

        return "cycle-{$cycleCode}-summary-".$this->timestamp().'.xlsx';
    }

    private function departmentFilename(Request $request): string
    {
        $departmentCode = Department::query()->find($request->integer('department_id'))?->code ?? 'all';

        return "department-{$departmentCode}-summary-".$this->timestamp().'.xlsx';
    }

    private function employeeFilename(Request $request): string
    {
        $employeeNumber = EmployeeProfile::query()->find($request->integer('employee_profile_id'))?->employee_number ?? 'all';
        $cycleCode = ReviewCycle::query()->find($request->integer('review_cycle_id'))?->code ?? 'all-cycles';

        return "employee-{$employeeNumber}-{$cycleCode}-".$this->timestamp().'.xlsx';
    }

    private function timestamp(): string
    {
        return now()->format('Ymd-Hi');
    }
}
