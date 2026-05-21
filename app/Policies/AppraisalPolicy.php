<?php

namespace App\Policies;

use App\Enums\AppraisalStatus;
use App\Enums\WorkflowStage;
use App\Models\Appraisal;
use App\Models\User;

class AppraisalPolicy
{
    private function hasGlobalAppraisalManagementAccess(User $user): bool
    {
        return $user->can('performance.appraisals.view_all')
            || $user->can('performance.appraisals.calibrate')
            || $user->can('performance.appraisals.finalize')
            || $user->can('performance.review_cycles.assign_employees');
    }

    private function isEmployee(User $user, Appraisal $appraisal): bool
    {
        return $appraisal->employee_user_id === $user->id;
    }

    private function isLineOrApprovingManager(User $user, Appraisal $appraisal): bool
    {
        return $appraisal->line_manager_user_id === $user->id
            || $appraisal->approving_manager_user_id === $user->id
            || $this->hasGlobalAppraisalManagementAccess($user);
    }

    private function goalPlanningUnlocked(Appraisal $appraisal): bool
    {
        return $appraisal->objectives()->exists()
            || $appraisal->goal_submitted_at !== null
            || ! in_array($appraisal->status, [AppraisalStatus::Draft], true);
    }

    private function selfAssessmentUnlocked(Appraisal $appraisal): bool
    {
        return $appraisal->goal_submitted_at !== null
            || $appraisal->self_assessment_submitted_at !== null;
    }

    private function managerReviewUnlocked(Appraisal $appraisal): bool
    {
        return $appraisal->self_assessment_submitted_at !== null
            || $appraisal->manager_reviewed_at !== null;
    }

    private function approvalUnlocked(Appraisal $appraisal): bool
    {
        return $appraisal->manager_reviewed_at !== null;
    }

    private function calibrationUnlocked(Appraisal $appraisal): bool
    {
        return $appraisal->approved_at !== null;
    }

    private function finalizationUnlocked(Appraisal $appraisal): bool
    {
        return $appraisal->calibrated_at !== null
            || $appraisal->status === AppraisalStatus::Finalized;
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
            || ($user->can('performance.appraisals.view_own') && $this->isEmployee($user, $appraisal))
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

    public function viewPlan(User $user, Appraisal $appraisal): bool
    {
        if (! $this->view($user, $appraisal) || ! $this->goalPlanningUnlocked($appraisal)) {
            return false;
        }

        return ($user->can('performance.appraisals.plan_own') && $this->isEmployee($user, $appraisal))
            || ($user->can('performance.appraisals.plan_manage') && $this->isLineOrApprovingManager($user, $appraisal))
            || $user->can('performance.review_cycles.assign_employees');
    }

    public function plan(User $user, Appraisal $appraisal): bool
    {
        if (! $this->viewPlan($user, $appraisal)) {
            return false;
        }

        return $this->canEditGoalsAtCurrentStage($appraisal)
            && (($user->can('performance.appraisals.plan_own') && $this->isEmployee($user, $appraisal))
            || ($user->can('performance.appraisals.plan_manage') && $this->isLineOrApprovingManager($user, $appraisal))
            || $user->can('performance.review_cycles.assign_employees'));
    }

    public function viewSelfAssessment(User $user, Appraisal $appraisal): bool
    {
        if (! $this->view($user, $appraisal) || ! $this->selfAssessmentUnlocked($appraisal)) {
            return false;
        }

        return ($user->can('performance.appraisals.self_assess') && $this->isEmployee($user, $appraisal))
            || ($user->can('performance.appraisals.manager_review') && $this->isLineOrApprovingManager($user, $appraisal))
            || ($user->can('performance.appraisals.approve') && (
                $appraisal->approving_manager_user_id === $user->id
                || $appraisal->line_manager_user_id === $user->id
                || $this->hasGlobalAppraisalManagementAccess($user)
            ))
            || $this->hasGlobalAppraisalManagementAccess($user);
    }

    public function selfAssess(User $user, Appraisal $appraisal): bool
    {
        if (! $this->viewSelfAssessment($user, $appraisal)) {
            return false;
        }

        $atSelfAssessmentStage = $appraisal->status === AppraisalStatus::SelfAssessmentPending
            || ($appraisal->status === AppraisalStatus::SentBack && $appraisal->reopened_stage === WorkflowStage::SelfAssessment);

        return $user->can('performance.appraisals.self_assess')
            && $this->isEmployee($user, $appraisal)
            && $atSelfAssessmentStage;
    }

    public function viewManagerReview(User $user, Appraisal $appraisal): bool
    {
        if (! $this->view($user, $appraisal) || ! $this->managerReviewUnlocked($appraisal)) {
            return false;
        }

        return $user->can('performance.appraisals.manager_review')
            && $this->isLineOrApprovingManager($user, $appraisal);
    }

    public function managerReview(User $user, Appraisal $appraisal): bool
    {
        if (! $this->viewManagerReview($user, $appraisal)) {
            return false;
        }

        $atManagerReviewStage = $appraisal->status === AppraisalStatus::ManagerReviewPending
            || $appraisal->status === AppraisalStatus::SelfAssessmentSubmitted
            || ($appraisal->status === AppraisalStatus::SentBack && $appraisal->reopened_stage === WorkflowStage::ManagerReview)
            || ($appraisal->status === AppraisalStatus::SentBack && $this->sentBackAllowsManagerReviewRework($appraisal));

        return $atManagerReviewStage;
    }

    public function viewApproval(User $user, Appraisal $appraisal): bool
    {
        if (! $this->view($user, $appraisal) || ! $this->approvalUnlocked($appraisal)) {
            return false;
        }

        return $user->can('performance.appraisals.approve')
            && (
                $appraisal->approving_manager_user_id === $user->id
                || $appraisal->line_manager_user_id === $user->id
                || $this->hasGlobalAppraisalManagementAccess($user)
            );
    }

    public function approve(User $user, Appraisal $appraisal): bool
    {
        if (! $this->viewApproval($user, $appraisal)) {
            return false;
        }

        $atApprovalStage = $appraisal->status === AppraisalStatus::ApprovalPending
            || ($appraisal->status === AppraisalStatus::SentBack && $appraisal->reopened_stage === WorkflowStage::Approval);

        return $atApprovalStage;
    }

    public function viewCalibrate(User $user, Appraisal $appraisal): bool
    {
        if (! $this->view($user, $appraisal) || ! $this->calibrationUnlocked($appraisal)) {
            return false;
        }

        return $user->can('performance.appraisals.calibrate');
    }

    public function calibrate(User $user, Appraisal $appraisal): bool
    {
        return $this->viewCalibrate($user, $appraisal)
            && $appraisal->status === AppraisalStatus::CalibrationPending
            && is_null($appraisal->calibrated_at);
    }

    public function viewFinalize(User $user, Appraisal $appraisal): bool
    {
        if (! $this->view($user, $appraisal) || ! $this->finalizationUnlocked($appraisal)) {
            return false;
        }

        return $user->can('performance.appraisals.finalize');
    }

    public function finalize(User $user, Appraisal $appraisal): bool
    {
        return $this->viewFinalize($user, $appraisal)
            && $appraisal->status === AppraisalStatus::CalibrationPending
            && ! is_null($appraisal->calibrated_at)
            && is_null($appraisal->finalized_at);
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
            && ($this->isEmployee($user, $appraisal) || $appraisal->line_manager_user_id === $user->id);
    }

    public function print(User $user, Appraisal $appraisal): bool
    {
        return $this->view($user, $appraisal)
            && ($user->can('performance.reports.print') || $user->can('performance.appraisals.view_own'));
    }

    private function sentBackAllowsManagerReviewRework(Appraisal $appraisal): bool
    {
        if (! in_array($appraisal->reopened_stage, [WorkflowStage::SelfAssessment, WorkflowStage::GoalSetting], true)) {
            return false;
        }

        return $appraisal->manager_reviewed_at !== null
            || $appraisal->self_assessment_submitted_at !== null;
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
