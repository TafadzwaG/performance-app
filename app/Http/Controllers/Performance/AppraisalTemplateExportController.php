<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\AppraisalTemplate;
use App\Services\Performance\Export\AppraisalTemplateExportService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Branded PDF / XLSX exports of an AppraisalTemplate. Mirrors the
 * AppraisalExportController contract — gated by the existing template `view`
 * policy so anyone allowed to see the template can download it.
 */
class AppraisalTemplateExportController extends Controller
{
    public function __construct(
        private readonly AppraisalTemplateExportService $exportService,
    ) {}

    public function pdf(Request $request, AppraisalTemplate $template): BinaryFileResponse
    {
        $this->authorize('view', $template);

        return $this->exportService->pdf($template, $request->user());
    }

    public function excel(Request $request, AppraisalTemplate $template): BinaryFileResponse
    {
        $this->authorize('view', $template);

        return $this->exportService->excel($template, $request->user());
    }
}
