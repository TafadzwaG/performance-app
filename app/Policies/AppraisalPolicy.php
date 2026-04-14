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
            || $user->can('performance.appraisals.finalize')
            || $user->can('performance.review_cycles.assign_employees');
    }

    public function viewAny(User $user): bool
    {
        return $user->can('performance.appraisals.view_all')
            || $user->can('performance.appraisals.view_own')
            || $user->can('performance.appraisals.manager_review')
            || $user->can('performance.appraisals.approve')
            || $user->can('performance.appraisals.finalize');
    }

    public function view(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.appraisals.view_all')
            || ($user->can('performance.appraisals.view_own') && $appraisal->employee_user_id === $user->id)
            || ($user->can('performance.appraisals.manager_review') && $appraisal->line_manager_user_id === $user->id)
            || ($user->can('performance.appraisals.approve') && $appraisal->approving_manager_user_id === $user->id)
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
        return ($user->can('performance.appraisals.plan_own') && $appraisal->employee_user_id === $user->id)
            || ($user->can('performance.appraisals.plan_manage') && (
                $appraisal->line_manager_user_id === $user->id
                || $appraisal->approving_manager_user_id === $user->id
                || $this->hasGlobalAppraisalManagementAccess($user)
            ))
            || $user->can('performance.review_cycles.assign_employees');
    }

    public function selfAssess(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.appraisals.self_assess') && $appraisal->employee_user_id === $user->id;
    }

    public function managerReview(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.appraisals.manager_review')
            && (
                $appraisal->line_manager_user_id === $user->id
                || $appraisal->approving_manager_user_id === $user->id
                || $this->hasGlobalAppraisalManagementAccess($user)
            );
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
        return $user->can('performance.appraisals.finalize');
    }

    public function sendBack(User $user, Appraisal $appraisal): bool
    {
        return $this->managerReview($user, $appraisal)
            || $this->approve($user, $appraisal)
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
}
