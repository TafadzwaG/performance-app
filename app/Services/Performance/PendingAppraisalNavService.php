<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\WorkflowStage;
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
        if ($user->can('performance.appraisals.view_all')) {
            return 0;
        }

        return Appraisal::query()
            ->where(fn (Builder $query) => $this->applyNeedsActionScope($query, $user))
            ->count();
    }

    public function applyIndexVisibleScope(Builder $query, User $user): Builder
    {
        if ($user->can('performance.appraisals.view_all')) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($user) {
            if ($this->hasEmployeeAppraisalVisibility($user)) {
                $builder->orWhere('employee_user_id', $user->id);
            }

            if ($user->can('performance.appraisals.plan_manage')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyLineManagerPlanningScope($scoped, $user));
            }

            if ($user->can('performance.appraisals.manager_review')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyLineManagerActionScope($scoped, $user));
            }

            if ($user->can('performance.appraisals.approve')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyApprovingManagerActionScope($scoped, $user));
            }

            if ($user->can('performance.appraisals.calibrate')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyCalibrationActionScope($scoped));
            }

            if ($user->can('performance.appraisals.finalize')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyFinalizationActionScope($scoped));
            }
        });
    }

    public function applyNeedsActionScope(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $builder) use ($user) {
            if ($this->hasEmployeeAppraisalVisibility($user)) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyEmployeeActionScope($scoped, $user));
            }

            if ($user->can('performance.appraisals.plan_manage')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyLineManagerPlanningScope($scoped, $user));
            }

            if ($user->can('performance.appraisals.manager_review')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyLineManagerActionScope($scoped, $user));
            }

            if ($user->can('performance.appraisals.approve')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyApprovingManagerActionScope($scoped, $user));
            }

            if ($user->can('performance.appraisals.calibrate')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyCalibrationActionScope($scoped));
            }

            if ($user->can('performance.appraisals.finalize')) {
                $builder->orWhere(fn (Builder $scoped) => $this->applyFinalizationActionScope($scoped));
            }
        });
    }

    private function hasEmployeeAppraisalVisibility(User $user): bool
    {
        return $user->can('performance.appraisals.view_own')
            || $user->can('performance.appraisals.self_assess')
            || $user->can('performance.appraisals.plan_own');
    }

    private function applyEmployeeActionScope(Builder $query, User $user): void
    {
        $query
            ->where('employee_user_id', $user->id)
            ->where(function (Builder $scoped) {
                $scoped
                    ->whereIn('status', [
                        AppraisalStatus::Draft->value,
                        AppraisalStatus::GoalSetting->value,
                        AppraisalStatus::SelfAssessmentPending->value,
                    ])
                    ->orWhere(function (Builder $sentBack) {
                        $sentBack
                            ->where('status', AppraisalStatus::SentBack->value)
                            ->whereIn('reopened_stage', [
                                WorkflowStage::GoalSetting->value,
                                WorkflowStage::SelfAssessment->value,
                            ]);
                    });
            });
    }

    private function applyLineManagerPlanningScope(Builder $query, User $user): void
    {
        $query
            ->where('line_manager_user_id', $user->id)
            ->where(function (Builder $scoped) {
                $scoped
                    ->whereIn('status', [
                        AppraisalStatus::Draft->value,
                        AppraisalStatus::GoalSetting->value,
                    ])
                    ->orWhere(function (Builder $sentBack) {
                        $sentBack
                            ->where('status', AppraisalStatus::SentBack->value)
                            ->where('reopened_stage', WorkflowStage::GoalSetting->value);
                    });
            });
    }

    private function applyLineManagerActionScope(Builder $query, User $user): void
    {
        $query
            ->where('line_manager_user_id', $user->id)
            ->where(function (Builder $scoped) {
                $scoped
                    ->whereIn('status', [
                        AppraisalStatus::ManagerReviewPending->value,
                        AppraisalStatus::SelfAssessmentSubmitted->value,
                    ])
                    ->orWhere(function (Builder $sentBack) {
                        $sentBack
                            ->where('status', AppraisalStatus::SentBack->value)
                            ->whereIn('reopened_stage', [
                                WorkflowStage::ManagerReview->value,
                                WorkflowStage::SelfAssessment->value,
                                WorkflowStage::GoalSetting->value,
                            ]);
                    });
            });
    }

    private function applyApprovingManagerActionScope(Builder $query, User $user): void
    {
        $query
            ->where('approving_manager_user_id', $user->id)
            ->where(function (Builder $scoped) {
                $scoped
                    ->where('status', AppraisalStatus::ApprovalPending->value)
                    ->orWhere(function (Builder $sentBack) {
                        $sentBack
                            ->where('status', AppraisalStatus::SentBack->value)
                            ->where('reopened_stage', WorkflowStage::Approval->value);
                    });
            });
    }

    private function applyCalibrationActionScope(Builder $query): void
    {
        $query
            ->where('status', AppraisalStatus::CalibrationPending->value)
            ->whereNull('calibrated_at');
    }

    private function applyFinalizationActionScope(Builder $query): void
    {
        $query
            ->where('status', AppraisalStatus::CalibrationPending->value)
            ->whereNotNull('calibrated_at')
            ->whereNull('finalized_at');
    }
}
