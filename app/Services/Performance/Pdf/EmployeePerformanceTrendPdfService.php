<?php

namespace App\Services\Performance\Pdf;

use App\Enums\PerformanceTrendStatus;
use App\Models\EmployeeProfile;
use App\Models\User;
use App\Services\Performance\EmployeePerformanceAnalyticsService;
use App\Support\Branding;
use App\Support\Pdf\StudioExportPdf;
use App\Support\Performance\PerformanceTrendChartSvg;
use App\Support\Performance\ScoreFormatter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EmployeePerformanceTrendPdfService
{
    public function __construct(
        private readonly EmployeePerformanceAnalyticsService $employeePerformanceAnalyticsService,
    ) {}

    public function download(EmployeeProfile $employeeProfile, User $actor): BinaryFileResponse
    {
        [$fileName, $filePath] = $this->render($employeeProfile, $actor);

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    /**
     * @return array{0:string,1:string}
     */
    private function render(EmployeeProfile $employeeProfile, User $actor): array
    {
        $employeeProfile->loadMissing(['user', 'department', 'jobTitle', 'lineManager']);

        $performanceTrend = $this->employeePerformanceAnalyticsService->employeeTrend($employeeProfile->id);
        $peerComparison = $this->employeePerformanceAnalyticsService->peerComparison($employeeProfile->id);

        if ($performanceTrend['points'] === []) {
            abort(422, 'No finalized performance scores are available to export.');
        }

        $employeeName = $employeeProfile->user?->name ?? $employeeProfile->employee_number;
        $fileName = sprintf(
            'employee-performance-trend-%s-%s.pdf',
            $employeeProfile->employee_number,
            Carbon::now()->format('Ymd-His'),
        );
        $tempPath = storage_path('app/exports/'.$fileName);
        $this->ensureDirectory(dirname($tempPath));

        StudioExportPdf::configure(
            Pdf::loadView('pdf.performance.employee-performance-trend', [
                ...Branding::exportHeaderContext(),
                'employeeProfile' => $employeeProfile,
                'performanceTrend' => $performanceTrend,
                'peerComparison' => $peerComparison,
                'chartSvg' => PerformanceTrendChartSvg::render($performanceTrend['points']),
                'exportedBy' => $actor->name,
                'exportedByEmail' => $actor->email,
                'exportedAt' => Carbon::now(),
                'headerReportLabel' => 'Employee Performance Trend',
                'trendStatusLabel' => PerformanceTrendStatus::from($performanceTrend['trend_status'])->label(),
            ])
        )->save($tempPath);

        return [$fileName, $tempPath];
    }

    private function ensureDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
    }
}
