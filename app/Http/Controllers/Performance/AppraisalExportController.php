<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\Appraisal;
use App\Services\Performance\Export\AppraisalExportService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Stage-agnostic export endpoints for an appraisal record. Users with the
 * "print" ability on the appraisal can download a branded landscape PDF or
 * a sectioned XLSX at any point in the lifecycle.
 */
class AppraisalExportController extends Controller
{
    public function __construct(
        private readonly AppraisalExportService $exportService,
    ) {}

    public function pdf(Request $request, Appraisal $appraisal): BinaryFileResponse
    {
        $this->authorize('print', $appraisal);

        return $this->exportService->pdf($appraisal, $request->user());
    }

    public function excel(Request $request, Appraisal $appraisal): BinaryFileResponse
    {
        $this->authorize('print', $appraisal);

        return $this->exportService->excel($appraisal, $request->user());
    }
}
