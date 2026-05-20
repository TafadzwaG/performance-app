<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Models\Appraisal;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class PendingAppraisalNavService
{
    public function shouldShowFor(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->can('performance.appraisals.view_own')
            || $user->can('performance.appraisals.self_assess')
            || $user->can('performance.appraisals.plan_own')
            || $user->can('performance.appraisals.manager_review')
            || $user->can('performance.appraisals.approve');
    }

    public function countFor(User $user): int
    {
        $count = 0;

        if (
            $user->can('performance.appraisals.self_assess')
            || $user->can('performance.appraisals.plan_own')
            || $user->can('performance.appraisals.view_own')
        ) {
            $count += Appraisal::query()
                ->where('employee_user_id', $user->id)
                ->whereIn('status', [
                    AppraisalStatus::GoalSetting->value,
                    AppraisalStatus::SelfAssessmentPending->value,
                    AppraisalStatus::SentBack->value,
                ])
                ->count();
        }

        if ($user->can('performance.appraisals.manager_review')) {
            $count += Appraisal::query()
                ->where('line_manager_user_id', $user->id)
                ->whereIn('status', [
                    AppraisalStatus::ManagerReviewPending->value,
                    AppraisalStatus::SelfAssessmentSubmitted->value,
                ])
                ->count();
        }

        if ($user->can('performance.appraisals.approve')) {
            $count += Appraisal::query()
                ->where('approving_manager_user_id', $user->id)
                ->where('status', AppraisalStatus::ApprovalPending->value)
                ->count();
        }

        return $count;
    }

    public function applyNeedsActionScope(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $builder) use ($user) {
            if (
                $user->can('performance.appraisals.self_assess')
                || $user->can('performance.appraisals.plan_own')
                || $user->can('performance.appraisals.view_own')
            ) {
                $builder->orWhere(function (Builder $employee) use ($user) {
                    $employee
                        ->where('employee_user_id', $user->id)
                        ->whereIn('status', [
                            AppraisalStatus::GoalSetting->value,
                            AppraisalStatus::SelfAssessmentPending->value,
                            AppraisalStatus::SentBack->value,
                        ]);
                });
            }

            if ($user->can('performance.appraisals.manager_review')) {
                $builder->orWhere(function (Builder $manager) use ($user) {
                    $manager
                        ->where('line_manager_user_id', $user->id)
                        ->whereIn('status', [
                            AppraisalStatus::ManagerReviewPending->value,
                            AppraisalStatus::SelfAssessmentSubmitted->value,
                        ]);
                });
            }

            if ($user->can('performance.appraisals.approve')) {
                $builder->orWhere(function (Builder $approval) use ($user) {
                    $approval
                        ->where('approving_manager_user_id', $user->id)
                        ->where('status', AppraisalStatus::ApprovalPending->value);
                });
            }
        });
    }
}
