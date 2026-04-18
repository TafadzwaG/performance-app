<?php

namespace App\Policies;

use App\Models\Appraisal;
use App\Models\User;
use App\Enums\AppraisalStatus;
use App\Enums\WorkflowStage;

class AppraisalPolicy
{
    private function hasGlobalAppraisalManagementAccess(User $user): bool
    {
        return $user->can('performance.appraisals.view_all')
            || $user->can('performance.appraisals.calibrate')
            || $user->can('performance.appraisals.finalize')
            || $user->can('performance.review_cycles.assign_employees');
    }

    public function viewAny(User $user): bool
    {
        return $user->can('performance.appraisals.view_all')
            || $user->can('performance.appraisals.view_own')
            || $user->can('performance.appraisals.manager_review')
            || $user->can('performance.appraisals.approve')
            || $user->can('performance.appraisals.calibrate')
            || $user->can('performance.appraisals.finalize');
    }

    public function view(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.appraisals.view_all')
            || ($user->can('performance.appraisals.view_own') && $appraisal->employee_user_id === $user->id)
            || ($user->can('performance.appraisals.manager_review') && $appraisal->line_manager_user_id === $user->id)
            || ($user->can('performance.appraisals.approve') && $appraisal->approving_manager_user_id === $user->id)
            || $user->can('performance.appraisals.calibrate')
            || $user->can('performance.appraisals.finalize');
    }

    public function create(User $user): bool
    {
        return $user->can('performance.review_cycles.assign_employees') || $user->can('performance.appraisals.view_all');
    }

    public function update(User $user, Appraisal $appraisal): bool
    {
        return $this->view($user, $appraisal);
    }

    public function plan(User $user, Appraisal $appraisal): bool
    {
        return $this->canEditGoalsAtCurrentStage($appraisal)
            && (($user->can('performance.appraisals.plan_own') && $appraisal->employee_user_id === $user->id)
            || ($user->can('performance.appraisals.plan_manage') && (
                $appraisal->line_manager_user_id === $user->id
                || $appraisal->approving_manager_user_id === $user->id
                || $this->hasGlobalAppraisalManagementAccess($user)
            ))
            || $user->can('performance.review_cycles.assign_employees'));
    }

    public function selfAssess(User $user, Appraisal $appraisal): bool
    {
        $atSelfAssessmentStage = $appraisal->status === AppraisalStatus::SelfAssessmentPending
            || ($appraisal->status === AppraisalStatus::SentBack && $appraisal->reopened_stage === WorkflowStage::SelfAssessment);

        return $user->can('performance.appraisals.self_assess')
            && $appraisal->employee_user_id === $user->id
            && $appraisal->objectives()->exists()
            && $atSelfAssessmentStage;
    }

    public function managerReview(User $user, Appraisal $appraisal): bool
    {
        $atManagerReviewStage = $appraisal->status === AppraisalStatus::ManagerReviewPending
            || $appraisal->status === AppraisalStatus::SelfAssessmentSubmitted
            || ($appraisal->status === AppraisalStatus::SentBack && $appraisal->reopened_stage === WorkflowStage::ManagerReview);

        return $user->can('performance.appraisals.manager_review')
            && (
                $appraisal->line_manager_user_id === $user->id
                || $appraisal->approving_manager_user_id === $user->id
                || $this->hasGlobalAppraisalManagementAccess($user)
            )
            && $atManagerReviewStage;
    }

    public function approve(User $user, Appraisal $appraisal): bool
    {
        $atApprovalStage = $appraisal->status === AppraisalStatus::ApprovalPending
            || ($appraisal->status === AppraisalStatus::SentBack && $appraisal->reopened_stage === WorkflowStage::Approval);

        return $user->can('performance.appraisals.approve')
            && (
                $appraisal->approving_manager_user_id === $user->id
                || $appraisal->line_manager_user_id === $user->id
                || $this->hasGlobalAppraisalManagementAccess($user)
            )
            && $atApprovalStage;
    }

    public function finalize(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.appraisals.finalize')
            && $appraisal->status === AppraisalStatus::CalibrationPending
            && ! is_null($appraisal->calibrated_at)
            && is_null($appraisal->finalized_at);
    }

    public function calibrate(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.appraisals.calibrate')
            && $appraisal->status === AppraisalStatus::CalibrationPending
            && is_null($appraisal->calibrated_at);
    }

    public function sendBack(User $user, Appraisal $appraisal): bool
    {
        return $this->managerReview($user, $appraisal)
            || $this->approve($user, $appraisal)
            || $this->calibrate($user, $appraisal)
            || $this->finalize($user, $appraisal);
    }

    public function uploadEvidence(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.appraisals.upload_evidence')
            && ($appraisal->employee_user_id === $user->id || $appraisal->line_manager_user_id === $user->id);
    }

    public function print(User $user, Appraisal $appraisal): bool
    {
        return $this->view($user, $appraisal)
            && ($user->can('performance.reports.print') || $user->can('performance.appraisals.view_own'));
    }

    private function canEditGoalsAtCurrentStage(Appraisal $appraisal): bool
    {
        return match ($appraisal->status) {
            AppraisalStatus::Draft, AppraisalStatus::GoalSetting => true,
            AppraisalStatus::SelfAssessmentPending => ! $this->hasStartedSelfAssessment($appraisal),
            AppraisalStatus::SentBack => $appraisal->reopened_stage === WorkflowStage::GoalSetting,
            default => false,
        };
    }

    private function hasStartedSelfAssessment(Appraisal $appraisal): bool
    {
        if ($appraisal->objectives()
            ->where(function ($query) {
                $query
                    ->whereNotNull('self_rating_scale_level_id')
                    ->orWhere(function ($nested) {
                        $nested->whereNotNull('performance_achieved')->where('performance_achieved', '!=', '');
                    })
                    ->orWhere(function ($nested) {
                        $nested->whereNotNull('employee_comment')->where('employee_comment', '!=', '');
                    });
            })
            ->exists()) {
            return true;
        }

        if ($appraisal->competencyRatings()
            ->where(function ($query) {
                $query
                    ->whereNotNull('self_rating_scale_level_id')
                    ->orWhere(function ($nested) {
                        $nested->whereNotNull('employee_comment')->where('employee_comment', '!=', '');
                    });
            })
            ->exists()) {
            return true;
        }

        return $appraisal->comments()
            ->whereIn('comment_type', ['achievement_note', 'significant_issue'])
            ->exists();
    }
}
