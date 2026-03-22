<?php

namespace App\Services\Performance\Pdf;

use App\Models\Appraisal;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppraisalPdfService
{
    public function download(Appraisal $appraisal): BinaryFileResponse
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
        ]);

        $cycleCode = $appraisal->reviewCycle?->code ?? $appraisal->review_cycle_id;
        $fileName = "appraisal-{$appraisal->employee_number_snapshot}-{$cycleCode}-final.pdf";
        $filePath = storage_path("app/{$fileName}");

        Pdf::loadView('pdf.performance.appraisal-summary', [
            'appraisal' => $appraisal,
        ])->setPaper('a4')->save($filePath);

        return response()->download($filePath, $fileName)->deleteFileAfterSend(true);
    }
}
