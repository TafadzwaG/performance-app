<?php

namespace App\Http\Controllers\Performance;

use App\Enums\ApprovalStage;
use App\Enums\CalibrationDecision;
use App\Enums\WorkflowStage;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\SubmitCalibrationDecisionRequest;
use App\Models\Appraisal;
use App\Models\RatingScaleLevel;
use App\Services\Performance\AppraisalScoringService;
use App\Services\Performance\AppraisalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalCalibrationController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalWorkflowService $workflowService,
        private readonly AppraisalScoringService $scoringService,
    ) {}

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('calibrate', $appraisal);

        return Inertia::render('performance/appraisals/Calibration', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
            'overallRatingOptions' => $appraisal->template?->overallRatingScale?->levels
                ?->sortBy('sort_order')
                ->map(fn (RatingScaleLevel $level) => [
                    'value' => $level->id,
                    'label' => $level->label,
                    'value_score' => $level->value,
                    'min_percent' => $level->min_percent,
                    'max_percent' => $level->max_percent,
                ])
                ->values()
                ->all() ?? [],
        ]);
    }

    public function store(SubmitCalibrationDecisionRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('calibrate', $appraisal);

        $decision = $request->validated('decision');

        if ($decision === 'send_back') {
            $this->workflowService->sendBack(
                $appraisal,
                $request->user(),
                WorkflowStage::Approval,
                (string) $request->validated('comment'),
                ApprovalStage::Calibration,
            );

            return to_route('performance.appraisals.show', $appraisal)
                ->with('success', 'Calibration sent the appraisal back to approval.');
        }

        $ratingLevel = null;
        if ($decision === 'adjusted' && $request->filled('calibrated_overall_score')) {
            $ratingLevel = $this->scoringService->resolveOverallLevel(
                $appraisal,
                (float) $request->input('calibrated_overall_score'),
            );
        }

        $evidenceFiles = $request->file('evidence_files', []);
        if (! is_array($evidenceFiles)) {
            $evidenceFiles = $evidenceFiles ? [$evidenceFiles] : [];
        }

        $this->workflowService->submitCalibration(
            $appraisal,
            $request->user(),
            $decision === 'adjusted' ? CalibrationDecision::Adjusted : CalibrationDecision::Confirmed,
            (string) $request->validated('comment'),
            $request->input('evidence_summary'),
            $request->filled('calibrated_overall_score') ? (float) $request->input('calibrated_overall_score') : null,
            $ratingLevel,
            $evidenceFiles,
        );

        return request()->user()?->can('finalize', $appraisal->fresh())
            ? redirect()->route('performance.appraisals.finalize', $appraisal)->with('success', 'Calibration decision recorded. Appraisal is ready for finalization.')
            : redirect()->route('performance.appraisals.show', $appraisal)->with('success', 'Calibration decision recorded successfully.');
    }
}
