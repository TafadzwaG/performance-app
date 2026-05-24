<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\AppraisalTemplate;
use App\Services\Performance\Export\AppraisalTemplateExportService;
use App\Support\Branding;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AppraisalTemplatePrintController extends Controller
{
    public function __construct(
        private readonly AppraisalTemplateExportService $exportService,
    ) {}

    public function show(Request $request, AppraisalTemplate $template): InertiaResponse
    {
        $this->authorize('view', $template);

        $template->loadMissing(['department', 'jobTitle']);
        $brandingRevision = Branding::exportRevision();

        return Inertia::render('performance/templates/Print', [
            'template' => $template->only([
                'id',
                'name',
                'code',
                'version',
                'description',
                'business_weight_percent',
                'values_weight_percent',
            ]),
            'pdfUrl' => route('performance.templates.print.pdf.inline', $template).'?v='.$brandingRevision,
            'layoutUrl' => route('performance.templates.preview.layout', $template).'?v='.$brandingRevision,
            'pdfDownloadUrl' => route('performance.templates.export.pdf', $template),
            'layoutBladePath' => 'resources/views/pdf/performance/template-export.blade.php',
        ]);
    }

    public function inline(Request $request, AppraisalTemplate $template): Response
    {
        $this->authorize('view', $template);

        return $this->exportService->streamPdf($template, $request->user());
    }

    public function layout(Request $request, AppraisalTemplate $template): Response
    {
        $this->authorize('view', $template);

        return $this->exportService->htmlPreview($template, $request->user());
    }
}
