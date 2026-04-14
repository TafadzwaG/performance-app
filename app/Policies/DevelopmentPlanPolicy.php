<?php

namespace App\Policies;

use App\Models\Appraisal;
use App\Models\DevelopmentPlan;
use App\Models\User;

class DevelopmentPlanPolicy
{
    private function isHrOrGlobalManager(User $user): bool
    {
        return $user->can('performance.appraisals.view_all')
            || $user->can('performance.appraisals.finalize')
            || $user->can('performance.review_cycles.assign_employees');
    }

    private function isManagerForAppraisal(User $user, Appraisal $appraisal): bool
    {
        return $appraisal->line_manager_user_id === $user->id
            || $appraisal->approving_manager_user_id === $user->id;
    }

    private function isEmployeeForAppraisal(User $user, Appraisal $appraisal): bool
    {
        return $appraisal->employee_user_id === $user->id;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('performance.development_plans.view');
    }

    public function view(User $user, DevelopmentPlan $developmentPlan): bool
    {
        return $user->can('performance.development_plans.view')
            || $developmentPlan->appraisal?->employee_user_id === $user->id
            || $developmentPlan->appraisal?->line_manager_user_id === $user->id
            || $developmentPlan->appraisal?->approving_manager_user_id === $user->id;
    }

    public function update(User $user, DevelopmentPlan $developmentPlan): bool
    {
        $appraisal = $developmentPlan->appraisal;

        if (!$appraisal) {
            return false;
        }

        return $this->manage($user, $appraisal) || $this->progress($user, $appraisal);
    }

    public function manage(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.development_plans.update')
            && ($this->isManagerForAppraisal($user, $appraisal) || $this->isHrOrGlobalManager($user));
    }

    public function progress(User $user, Appraisal $appraisal): bool
    {
        return $user->can('performance.development_plans.update')
            && $this->isEmployeeForAppraisal($user, $appraisal);
    }
}
