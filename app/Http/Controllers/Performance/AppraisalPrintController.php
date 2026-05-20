<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Models\Appraisal;
use App\Services\Performance\Pdf\AppraisalPdfService;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppraisalPrintController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalPdfService $appraisalPdfService,
    ) {}

    /**
     * Print preview page — renders the same landscape PDF inline inside the
     * app shell so the user sees exactly what they'll print/download.
     */
    public function show(Appraisal $appraisal): InertiaResponse
    {
        $this->authorize('print', $appraisal);

        return Inertia::render('performance/appraisals/Print', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
            'pdfUrl' => route('performance.appraisals.print.pdf.inline', $appraisal->id),
            'pdfDownloadUrl' => route('performance.appraisals.print.pdf', $appraisal->id),
        ]);
    }

    public function pdf(Appraisal $appraisal): BinaryFileResponse
    {
        $this->authorize('print', $appraisal);

        return $this->appraisalPdfService->download($this->loadAppraisal($appraisal));
    }

    /**
     * Stream the PDF inline (Content-Disposition: inline) so the browser can
     * render it directly inside an iframe on the print preview page.
     */
    public function inline(Appraisal $appraisal): Response
    {
        $this->authorize('print', $appraisal);

        return $this->appraisalPdfService->stream($this->loadAppraisal($appraisal));
    }
}
