<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\ApprovalAction;
use App\Enums\ApprovalStage;
use App\Enums\CalibrationDecision;
use App\Enums\CommentType;
use App\Enums\WorkflowStage;
use App\Events\Performance\AppraisalStatusChanged;
use App\Models\Appraisal;
use App\Models\AppraisalApproval;
use App\Models\AppraisalCalibration;
use App\Models\AppraisalComment;
use App\Models\AppraisalStatusHistory;
use App\Models\RatingScaleLevel;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AppraisalWorkflowService
{
    public function __construct(
        private readonly AppraisalScoringService $scoringService,
        private readonly EvidenceStorageService $evidenceStorageService,
    ) {}

    public function submitGoalPlan(Appraisal $appraisal, User $actor): Appraisal
    {
        return DB::transaction(function () use ($appraisal, $actor) {
            $appraisal->loadMissing('objectives');

            $weightTotal = (float) $appraisal->objectives
                ->where('include_in_business_score', true)
                ->sum('weight');

            if (round($weightTotal, 2) !== 100.0) {
                throw ValidationException::withMessages([
                    'objectives' => 'Business objective weights must total 100 before submission.',
                ]);
            }

            return $this->transition(
                $appraisal,
                $actor,
                AppraisalStatus::SelfAssessmentPending,
                ApprovalStage::GoalSetting,
                ApprovalAction::Submitted,
                'Goal plan submitted.',
                ['goal_submitted_at' => now(), 'reopened_stage' => null]
            );
        });
    }

    public function submitSelfAssessment(Appraisal $appraisal, User $actor): Appraisal
    {
        return DB::transaction(function () use ($appraisal, $actor) {
            $appraisal->loadMissing(['objectives', 'competencyRatings']);

            Validator::make(
                ['objectives' => $appraisal->objectives->toArray()],
                ['objectives.*.self_rating_scale_level_id' => ['required']]
            )->validate();

            $attributes = [
                'self_assessment_submitted_at' => now(),
                'reopened_stage' => null,
            ];

            if ($appraisal->status === AppraisalStatus::SentBack) {
                $attributes['manager_reviewed_at'] = null;
                $attributes['approved_at'] = null;
                $attributes['calibrated_at'] = null;
                $attributes['calibrated_by_user_id'] = null;
                $attributes['calibrated_overall_score'] = null;
                $attributes['calibrated_overall_rating_scale_level_id'] = null;
                $attributes['calibration_comment'] = null;
            }

            return $this->transition(
                $appraisal,
                $actor,
                AppraisalStatus::ManagerReviewPending,
                ApprovalStage::SelfAssessment,
                ApprovalAction::Submitted,
                $appraisal->status === AppraisalStatus::SentBack
                    ? 'Self assessment resubmitted after send back.'
                    : 'Self assessment submitted.',
                $attributes,
                'self_submitted'
            );
        });
    }

    public function submitManagerReview(Appraisal $appraisal, User $actor, ?string $comments = null): Appraisal
    {
        return DB::transaction(function () use ($appraisal, $actor, $comments) {
            if (! $this->canSubmitManagerReview($appraisal)) {
                throw ValidationException::withMessages([
                    'appraisal' => $this->managerReviewSubmitBlockedMessage($appraisal),
                ]);
            }

            $appraisal->loadMissing(['objectives', 'competencyRatings']);

            Validator::make(
                ['objectives' => $appraisal->objectives->toArray()],
                ['objectives.*.manager_rating_scale_level_id' => ['required']]
            )->validate();

            if ($comments) {
                AppraisalComment::create([
                    'appraisal_id' => $appraisal->id,
                    'author_user_id' => $actor->id,
                    'comment_type' => CommentType::General,
                    'body' => $comments,
                ]);
            }

            $appraisal = $this->scoringService->refresh($appraisal);

            return $this->transition(
                $appraisal,
                $actor,
                AppraisalStatus::ApprovalPending,
                ApprovalStage::ManagerReview,
                ApprovalAction::Forwarded,
                'Manager review completed.',
                ['manager_reviewed_at' => now(), 'reopened_stage' => null],
                'approval_requested'
            );
        });
    }

    private function canSubmitManagerReview(Appraisal $appraisal): bool
    {
        if (in_array($appraisal->status, [AppraisalStatus::ManagerReviewPending, AppraisalStatus::SelfAssessmentSubmitted], true)) {
            return true;
        }

        if ($appraisal->status !== AppraisalStatus::SentBack) {
            return false;
        }

        return match ($appraisal->reopened_stage) {
            WorkflowStage::ManagerReview => true,
            WorkflowStage::SelfAssessment => $appraisal->self_assessment_submitted_at !== null,
            default => false,
        };
    }

    private function managerReviewSubmitBlockedMessage(Appraisal $appraisal): string
    {
        if ($appraisal->status === AppraisalStatus::SentBack && $appraisal->reopened_stage === WorkflowStage::SelfAssessment) {
            return 'The employee must resubmit their self assessment before you can forward the manager review again.';
        }

        return 'This appraisal is not ready for manager review submission.';
    }

    public function sendBack(Appraisal $appraisal, User $actor, WorkflowStage $reopenStage, string $reason, ApprovalStage $stage, bool $rejected = false): Appraisal
    {
        return DB::transaction(function () use ($appraisal, $actor, $reopenStage, $reason, $stage, $rejected) {
            $previousStatus = $appraisal->status;

            $attributes = [
                'status' => AppraisalStatus::SentBack,
                'reopened_stage' => $reopenStage,
            ];

            if ($reopenStage === WorkflowStage::SelfAssessment) {
                $attributes['self_assessment_submitted_at'] = null;
            }

            if ($reopenStage === WorkflowStage::ManagerReview) {
                $attributes['manager_reviewed_at'] = null;
            }

            $appraisal->forceFill($attributes)->save();

            AppraisalComment::create([
                'appraisal_id' => $appraisal->id,
                'author_user_id' => $actor->id,
                'comment_type' => CommentType::SendBack,
                'body' => $reason,
            ]);

            AppraisalApproval::create([
                'appraisal_id' => $appraisal->id,
                'actor_user_id' => $actor->id,
                'stage' => $stage,
                'action' => $rejected ? ApprovalAction::Rejected : ApprovalAction::SentBack,
                'comments' => $reason,
                'snapshot' => $this->snapshot($appraisal),
                'acted_at' => now(),
            ]);

            $this->recordStatusHistory($appraisal, $actor, $previousStatus, AppraisalStatus::SentBack, $reason);

            event(new AppraisalStatusChanged($appraisal, $actor, 'sent_back'));

            return $appraisal->refresh();
        });
    }

    public function approve(Appraisal $appraisal, User $actor, ?string $comments = null): Appraisal
    {
        return DB::transaction(function () use ($appraisal, $actor, $comments) {
            $appraisal->refresh();
            $status = $appraisal->status;

            $canApproveAtCurrentStage = $status === AppraisalStatus::ApprovalPending
                || ($status === AppraisalStatus::SentBack && $appraisal->reopened_stage === WorkflowStage::Approval);

            if (! $canApproveAtCurrentStage) {
                throw ValidationException::withMessages([
                    'decision' => 'This appraisal is not currently at approval stage.',
                ]);
            }

            $scores = $this->scoringService->calculate($appraisal);
            $previousStatus = $status;

            $appraisal->forceFill([
                'status' => AppraisalStatus::CalibrationPending,
                'business_score' => $scores['business_score'],
                'values_score' => $scores['values_score'],
                'overall_score' => $scores['overall_score'],
                'overall_rating_scale_level_id' => $scores['overall_level']?->id,
                'calibrated_overall_score' => null,
                'calibrated_overall_rating_scale_level_id' => null,
                'calibration_comment' => null,
                'calibrated_at' => null,
                'calibrated_by_user_id' => null,
                'approved_at' => now(),
                'reopened_stage' => null,
            ])->save();

            AppraisalApproval::create([
                'appraisal_id' => $appraisal->id,
                'actor_user_id' => $actor->id,
                'stage' => ApprovalStage::Approval,
                'action' => ApprovalAction::Approved,
                'comments' => $comments,
                'snapshot' => $this->snapshot($appraisal),
                'acted_at' => now(),
            ]);

            $this->recordStatusHistory($appraisal, $actor, $previousStatus, AppraisalStatus::CalibrationPending, $comments);

            event(new AppraisalStatusChanged($appraisal, $actor, 'calibration_requested'));

            return $appraisal->refresh();
        });
    }

    /**
     * @param  array<int, UploadedFile>  $evidenceFiles
     */
    public function submitCalibration(
        Appraisal $appraisal,
        User $actor,
        CalibrationDecision $decision,
        string $comments,
        ?string $evidenceSummary = null,
        ?float $calibratedOverallScore = null,
        ?RatingScaleLevel $calibratedOverallRatingLevel = null,
        array $evidenceFiles = [],
    ): Appraisal {
        return DB::transaction(function () use (
            $appraisal,
            $actor,
            $decision,
            $comments,
            $evidenceSummary,
            $calibratedOverallScore,
            $calibratedOverallRatingLevel,
            $evidenceFiles,
        ) {
            if ($appraisal->status !== AppraisalStatus::CalibrationPending) {
                throw ValidationException::withMessages([
                    'decision' => 'This appraisal is not currently at calibration stage.',
                ]);
            }

            if ($appraisal->calibrated_at) {
                throw ValidationException::withMessages([
                    'decision' => 'This appraisal has already been calibrated.',
                ]);
            }

            $calibration = AppraisalCalibration::create([
                'appraisal_id' => $appraisal->id,
                'actor_user_id' => $actor->id,
                'decision' => $decision,
                'original_overall_score' => $appraisal->overall_score,
                'original_overall_rating_scale_level_id' => $appraisal->overall_rating_scale_level_id,
                'calibrated_overall_score' => $decision === CalibrationDecision::Adjusted ? $calibratedOverallScore : $appraisal->overall_score,
                'calibrated_overall_rating_scale_level_id' => $decision === CalibrationDecision::Adjusted
                    ? $calibratedOverallRatingLevel?->id
                    : $appraisal->overall_rating_scale_level_id,
                'comments' => $comments,
                'evidence_summary' => $evidenceSummary,
            ]);

            foreach ($evidenceFiles as $file) {
                $this->evidenceStorageService->storeCalibrationFile($calibration, $file, $actor);
            }

            $appraisal->forceFill([
                'calibrated_overall_score' => $decision === CalibrationDecision::Adjusted ? $calibratedOverallScore : $appraisal->overall_score,
                'calibrated_overall_rating_scale_level_id' => $decision === CalibrationDecision::Adjusted
                    ? $calibratedOverallRatingLevel?->id
                    : $appraisal->overall_rating_scale_level_id,
                'calibration_comment' => $comments,
                'calibrated_at' => now(),
                'calibrated_by_user_id' => $actor->id,
            ])->save();

            AppraisalApproval::create([
                'appraisal_id' => $appraisal->id,
                'actor_user_id' => $actor->id,
                'stage' => ApprovalStage::Calibration,
                'action' => ApprovalAction::Calibrated,
                'comments' => $comments,
                'snapshot' => $this->snapshot($appraisal->refresh()),
                'acted_at' => now(),
            ]);

            $this->recordStatusHistory($appraisal->refresh(), $actor, AppraisalStatus::CalibrationPending, AppraisalStatus::CalibrationPending, $comments);

            event(new AppraisalStatusChanged($appraisal->refresh(), $actor, 'calibration_completed'));

            return $appraisal->refresh();
        });
    }

    public function finalize(Appraisal $appraisal, User $actor, ?string $comments = null): Appraisal
    {
        return DB::transaction(function () use ($appraisal, $actor, $comments) {
            if ($appraisal->status !== AppraisalStatus::CalibrationPending || ! $appraisal->calibrated_at) {
                throw ValidationException::withMessages([
                    'finalize' => 'Only calibrated appraisals can be finalized.',
                ]);
            }

            if ($appraisal->finalized_at) {
                throw ValidationException::withMessages([
                    'finalize' => 'This appraisal has already been finalized.',
                ]);
            }

            $appraisal = $this->scoringService->refresh($appraisal);
            $previousStatus = $appraisal->status;

            $appraisal->forceFill([
                'status' => AppraisalStatus::Finalized,
                'finalized_at' => now(),
            ])->save();

            AppraisalApproval::create([
                'appraisal_id' => $appraisal->id,
                'actor_user_id' => $actor->id,
                'stage' => ApprovalStage::Finalization,
                'action' => ApprovalAction::Finalized,
                'comments' => $comments,
                'snapshot' => $this->snapshot($appraisal),
                'acted_at' => now(),
            ]);

            $this->recordStatusHistory($appraisal, $actor, $previousStatus, AppraisalStatus::Finalized, $comments);

            event(new AppraisalStatusChanged($appraisal, $actor, 'finalized'));

            return $appraisal->refresh();
        });
    }

    private function transition(
        Appraisal $appraisal,
        User $actor,
        AppraisalStatus $toStatus,
        ApprovalStage $stage,
        ApprovalAction $action,
        ?string $comments,
        array $attributes = [],
        ?string $eventName = null,
    ): Appraisal {
        $previousStatus = $appraisal->status;

        $appraisal->forceFill(array_merge($attributes, ['status' => $toStatus]))->save();

        AppraisalApproval::create([
            'appraisal_id' => $appraisal->id,
            'actor_user_id' => $actor->id,
            'stage' => $stage,
            'action' => $action,
            'comments' => $comments,
            'snapshot' => $this->snapshot($appraisal),
            'acted_at' => now(),
        ]);

        $this->recordStatusHistory($appraisal, $actor, $previousStatus, $toStatus, $comments);

        if ($eventName) {
            event(new AppraisalStatusChanged($appraisal, $actor, $eventName));
        }

        return $appraisal->refresh();
    }

    private function recordStatusHistory(Appraisal $appraisal, User $actor, ?AppraisalStatus $fromStatus, AppraisalStatus $toStatus, ?string $reason): void
    {
        AppraisalStatusHistory::create([
            'appraisal_id' => $appraisal->id,
            'actor_user_id' => $actor->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'reason' => $reason,
            'metadata' => $this->snapshot($appraisal),
            'changed_at' => now(),
        ]);
    }

    private function snapshot(Appraisal $appraisal): array
    {
        $appraisal->loadMissing(['objectives', 'competencyRatings', 'overallRatingLevel']);

        return [
            'status' => $appraisal->status?->value,
            'business_score' => $appraisal->business_score,
            'values_score' => $appraisal->values_score,
            'overall_score' => $appraisal->overall_score,
            'overall_rating' => $appraisal->overallRatingLevel?->label,
            'objectives' => $appraisal->objectives->map(fn ($objective) => [
                'title' => $objective->title,
                'weight' => $objective->weight,
                'self_rating' => $objective->self_rating_score,
                'manager_rating' => $objective->manager_rating_score,
            ])->values()->all(),
            'competencies' => $appraisal->competencyRatings->map(fn ($rating) => [
                'competency_id' => $rating->competency_id,
                'self_rating' => $rating->self_rating_score,
                'manager_rating' => $rating->manager_rating_score,
            ])->values()->all(),
            'calibration' => [
                'calibrated_overall_score' => $appraisal->calibrated_overall_score,
                'calibrated_overall_rating_scale_level_id' => $appraisal->calibrated_overall_rating_scale_level_id,
                'calibration_comment' => $appraisal->calibration_comment,
                'calibrated_at' => $appraisal->calibrated_at,
            ],
        ];
    }
}
