<?php

namespace App\Policies;

use App\Models\DevelopmentPlan;
use App\Models\User;

class DevelopmentPlanPolicy
{
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
        return $user->can('performance.development_plans.update');
    }
}
