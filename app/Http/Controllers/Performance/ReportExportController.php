<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\ExportReportRequest;
use App\Services\Performance\Export\ReportExportService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportExportController extends Controller
{
    public function __construct(
        private readonly ReportExportService $reportExportService,
    ) {}

    public function export(ExportReportRequest $request, string $report): BinaryFileResponse
    {
        abort_unless($request->user()->can('performance.reports.export'), 403);

        $filters = $request->validated();
        $format = $filters['format'] ?? 'xlsx';
        unset($filters['format']);

        return match ($format) {
            'pdf' => $this->reportExportService->pdf($report, $request->user(), $filters),
            default => $this->reportExportService->excel($report, $request->user(), $filters),
        };
    }
}
