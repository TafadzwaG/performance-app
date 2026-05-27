<?php

namespace App\Services\Performance\Pdf;

use App\Models\Appraisal;
use App\Support\Branding;
use App\Support\Pdf\StudioExportPdf;
use App\Support\Performance\ScoreFormatter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppraisalPdfService
{
    public function download(Appraisal $appraisal): BinaryFileResponse
    {
        [$fileName, $filePath] = $this->render($appraisal);

        return response()->download($filePath, $fileName)->deleteFileAfterSend(true);
    }

    /**
     * Stream the same PDF inline so the browser can render it directly
     * (used by the in-app "Print preview" so the layout matches the PDF).
     */
    public function stream(Appraisal $appraisal): Response
    {
        [$fileName, $filePath] = $this->render($appraisal);
        $contents = file_get_contents($filePath);
        @unlink($filePath);

        return response($contents, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$fileName.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ]);
    }

    /**
     * @return array{0:string,1:string} [fileName, absolutePath]
     */
    private function render(Appraisal $appraisal): array
    {
        $appraisal = $appraisal->loadMissing([
            'reviewCycle',
            'employeeProfile.department',
            'employeeProfile.jobTitle',
            'template.objectiveRatingScale.levels',
            'template.competencyRatingScale.levels',
            'template.overallRatingScale.levels',
            'objectives.perspective',
            'objectives.selfRatingLevel',
            'objectives.managerRatingLevel',
            'competencyRatings.competency',
            'competencyRatings.selfRatingLevel',
            'competencyRatings.managerRatingLevel',
            'comments.author',
            'approvals.actor',
            'statusHistories.actor',
            'developmentPlan.actions.owner',
            'overallRatingLevel',
            'calibratedOverallRatingLevel',
            'latestCalibration',
        ]);

        $cycleCode = $appraisal->reviewCycle?->code ?? $appraisal->review_cycle_id;
        $fileName = "appraisal-{$appraisal->employee_number_snapshot}-{$cycleCode}-final.pdf";
        $filePath = storage_path("app/{$fileName}");

        StudioExportPdf::configure(
            Pdf::loadView('pdf.performance.appraisal-assessment-form', [
                ...Branding::exportHeaderContext(),
                'appraisal' => $appraisal,
                'exportedAt' => Carbon::now(),
                'headerReportLabel' => 'Individual Performance Assessment Form',
                'statusLabel' => Str::of((string) ($appraisal->status?->value ?? $appraisal->status))->replace('_', ' ')->title(),
                'scoreSummary' => ScoreFormatter::summaryFor($appraisal),
            ])
        )->save($filePath);

        return [$fileName, $filePath];
    }
}
