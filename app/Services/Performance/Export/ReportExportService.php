<?php

namespace App\Services\Performance\Export;

use App\Exports\Performance\BasePerformanceExport;
use App\Exports\Performance\CompletionStatusExport;
use App\Exports\Performance\CycleSummaryExport;
use App\Exports\Performance\DepartmentSummaryExport;
use App\Exports\Performance\EmployeePerformanceMovementExport;
use App\Exports\Performance\EmployeeSummaryExport;
use App\Exports\Performance\OverdueReviewsExport;
use App\Exports\Performance\RatingDistributionExport;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\EmployeePerformanceAnalyticsService;
use App\Services\Performance\ReportQueryService;
use App\Support\Branding;
use App\Support\Pdf\StudioExportPdf;
use App\Support\Tenancy\TenantStoragePath;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportExportService
{
    /**
     * @var array<string, array{
     *     title: string,
     *     description: string,
     *     query: string,
     *     export: class-string<BasePerformanceExport>,
     *     filename: callable(array): string
     * }>
     */
    private const REPORTS = [
        'cycle-summary' => [
            'title' => 'Cycle Summary',
            'description' => 'Cycle-level totals, completion, and effective score movement.',
            'query' => 'cycleSummary',
            'export' => CycleSummaryExport::class,
            'filename' => 'cycleSummaryFilename',
        ],
        'department-summary' => [
            'title' => 'Department Summary',
            'description' => 'Department-level completion and effective score detail.',
            'query' => 'departmentSummary',
            'export' => DepartmentSummaryExport::class,
            'filename' => 'departmentSummaryFilename',
        ],
        'employee-summary' => [
            'title' => 'Employee Summary',
            'description' => 'Per-employee appraisal outcomes and effective scores.',
            'query' => 'employeeSummary',
            'export' => EmployeeSummaryExport::class,
            'filename' => 'employeeSummaryFilename',
        ],
        'completion-status' => [
            'title' => 'Completion Status',
            'description' => 'Workflow status counts and completion position.',
            'query' => 'completionStatus',
            'export' => CompletionStatusExport::class,
            'filename' => 'completionStatusFilename',
        ],
        'rating-distribution' => [
            'title' => 'Rating Distribution',
            'description' => 'Effective rating mix and rating spread.',
            'query' => 'ratingDistribution',
            'export' => RatingDistributionExport::class,
            'filename' => 'ratingDistributionFilename',
        ],
        'overdue-reviews' => [
            'title' => 'Overdue Reviews',
            'description' => 'Deadline misses with manager and approver context.',
            'query' => 'overdueReviews',
            'export' => OverdueReviewsExport::class,
            'filename' => 'overdueReviewsFilename',
        ],
        'employee-performance-movement' => [
            'title' => 'Employee Performance Movement',
            'description' => 'Effective score movement, trend status, and same-scorecard peer comparison.',
            'query' => 'employeePerformanceMovement',
            'export' => EmployeePerformanceMovementExport::class,
            'filename' => 'employeePerformanceMovementFilename',
        ],
    ];

    public function __construct(
        private readonly ReportQueryService $reportQueryService,
        private readonly EmployeePerformanceAnalyticsService $employeePerformanceAnalyticsService,
    ) {}

    public function excel(string $report, User $actor, array $filters = []): BinaryFileResponse
    {
        [$definition, $export] = $this->resolve($report, $filters);
        $filenameMethod = $definition['filename'];

        return $export->download($this->{$filenameMethod}($filters));
    }

    public function pdf(string $report, User $actor, array $filters = []): BinaryFileResponse
    {
        [$definition, $export] = $this->resolve($report, $filters);
        $filenameMethod = $definition['filename'];
        $fileName = str_replace('.xlsx', '.pdf', $this->{$filenameMethod}($filters));
        $tempPath = TenantStoragePath::export($fileName);
        $this->ensureDirectory(dirname($tempPath));

        StudioExportPdf::configure(
            Pdf::loadView('pdf.performance.report-table', $this->buildPdfContext($definition, $export, $filters, $actor))
        )->save($tempPath);

        return response()->download($tempPath, $fileName, [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    /**
     * @return array{0: array<string, mixed>, 1: BasePerformanceExport}
     */
    private function resolve(string $report, array $filters): array
    {
        abort_unless(isset(self::REPORTS[$report]), 404);

        $definition = self::REPORTS[$report];
        $rows = $this->queryRows($definition['query'], $filters);
        $exportClass = $definition['export'];

        return [$definition, new $exportClass($rows)];
    }

    private function queryRows(string $method, array $filters): Collection
    {
        if ($method === 'employeePerformanceMovement') {
            return collect($this->employeePerformanceAnalyticsService->movementReport($filters)['movement_rows']);
        }

        $rows = $this->reportQueryService->{$method}($filters);

        if ($method === 'overdueReviews') {
            return $rows->load(['lineManager', 'approvingManager']);
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $definition
     * @return array<string, mixed>
     */
    private function buildPdfContext(array $definition, BasePerformanceExport $export, array $filters, User $actor): array
    {
        $filterRows = $this->filterRows($filters);
        $tableRows = $export->dataRows();

        if ($tableRows === []) {
            $tableRows = [array_fill(0, count($export->headingLabels()), '—')];
            $tableRows[0][0] = 'No records matched the selected filters.';
        }

        $branding = Branding::exportHeaderContext();

        return [
            ...$branding,
            'branding' => $branding,
            'reportTitle' => $definition['title'],
            'headerReportLabel' => $definition['title'],
            'reportDescription' => $definition['description'],
            'headings' => $export->headingLabels(),
            'tableRows' => $tableRows,
            'totalRows' => $export->rowCount(),
            'filterRows' => $filterRows,
            'exportedBy' => $actor->name,
            'exportedByEmail' => $actor->email,
            'exportedAt' => Carbon::now(),
        ];
    }

    /**
     * @return array<int, array{0: string, 1: string}>
     */
    private function filterRows(array $filters): array
    {
        return [
            ['Review Cycle', $this->reviewCycleLabel($filters['review_cycle_id'] ?? null)],
            ['Department', $this->departmentLabel($filters['department_id'] ?? null)],
            ['Employee', $this->employeeLabel($filters['employee_profile_id'] ?? null)],
        ];
    }

    private function reviewCycleLabel(?int $reviewCycleId): string
    {
        if (! $reviewCycleId) {
            return 'All cycles';
        }

        return ReviewCycle::query()->find($reviewCycleId)?->name ?? 'Unknown cycle';
    }

    private function departmentLabel(?int $departmentId): string
    {
        if (! $departmentId) {
            return 'All departments';
        }

        return Department::query()->find($departmentId)?->name ?? 'Unknown department';
    }

    private function employeeLabel(?int $employeeProfileId): string
    {
        if (! $employeeProfileId) {
            return 'All employees';
        }

        $profile = EmployeeProfile::query()->find($employeeProfileId);

        if ($profile === null) {
            return 'Unknown employee';
        }

        return trim(($profile->employee_number ?: 'Employee').' · '.($profile->user?->name ?? 'Unnamed'));
    }

    private function cycleSummaryFilename(array $filters): string
    {
        $cycleCode = ReviewCycle::query()->find($filters['review_cycle_id'] ?? null)?->code ?? 'all-cycles';

        return "cycle-{$cycleCode}-summary-".$this->timestamp().'.xlsx';
    }

    private function departmentSummaryFilename(array $filters): string
    {
        $departmentCode = Department::query()->find($filters['department_id'] ?? null)?->code ?? 'all';

        return "department-{$departmentCode}-summary-".$this->timestamp().'.xlsx';
    }

    private function employeeSummaryFilename(array $filters): string
    {
        $employeeNumber = EmployeeProfile::query()->find($filters['employee_profile_id'] ?? null)?->employee_number ?? 'all';
        $cycleCode = ReviewCycle::query()->find($filters['review_cycle_id'] ?? null)?->code ?? 'all-cycles';

        return "employee-{$employeeNumber}-{$cycleCode}-".$this->timestamp().'.xlsx';
    }

    private function completionStatusFilename(array $filters): string
    {
        return 'completion-status-'.$this->timestamp().'.xlsx';
    }

    private function ratingDistributionFilename(array $filters): string
    {
        return 'rating-distribution-'.$this->timestamp().'.xlsx';
    }

    private function overdueReviewsFilename(array $filters): string
    {
        return 'overdue-reviews-'.$this->timestamp().'.xlsx';
    }

    private function employeePerformanceMovementFilename(array $filters): string
    {
        $cycleCode = ReviewCycle::query()->find($filters['review_cycle_id'] ?? null)?->code ?? 'all-cycles';

        return "employee-performance-movement-{$cycleCode}-".$this->timestamp().'.xlsx';
    }

    private function timestamp(): string
    {
        return now()->format('Ymd-Hi');
    }

    private function ensureDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
    }
}
