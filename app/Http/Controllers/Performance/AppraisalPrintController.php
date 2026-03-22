<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Models\Appraisal;
use App\Services\Performance\Pdf\AppraisalPdfService;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppraisalPrintController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalPdfService $appraisalPdfService,
    ) {
    }

    public function show(Appraisal $appraisal): Response
    {
        $this->authorize('print', $appraisal);

        return Inertia::render('performance/appraisals/Print', [
            'appraisal' => $this->loadAppraisal($appraisal),
        ]);
    }

    public function pdf(Appraisal $appraisal): BinaryFileResponse
    {
        $this->authorize('print', $appraisal);

        return $this->appraisalPdfService->download($this->loadAppraisal($appraisal));
    }
}
