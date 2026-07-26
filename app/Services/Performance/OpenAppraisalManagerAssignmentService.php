<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\WorkflowStage;
use App\Models\Appraisal;
use App\Models\EmployeeProfile;
use App\Models\User;
use App\Notifications\Performance\ApprovalRequestedNotification;
use Illuminate\Support\Facades\Cache;

class OpenAppraisalManagerAssignmentService
{
    public function sync(
        EmployeeProfile $employeeProfile,
        bool $syncLineManager,
        bool $syncApprovingManager,
    ): int {
        if (! $syncLineManager && ! $syncApprovingManager) {
            return 0;
        }

        $updatedCount = 0;

        Appraisal::query()
            ->where('employee_profile_id', $employeeProfile->id)
            ->where('status', '!=', AppraisalStatus::Finalized->value)
            ->whereNull('finalized_at')
            ->get()
            ->each(function (Appraisal $appraisal) use (
                $employeeProfile,
                $syncLineManager,
                $syncApprovingManager,
                &$updatedCount,
            ): void {
                $previousLineManagerId = $appraisal->line_manager_user_id;
                $previousApprovingManagerId = $appraisal->approving_manager_user_id;

                if ($syncLineManager) {
                    $appraisal->line_manager_user_id = $employeeProfile->line_manager_user_id;
                }

                if ($syncApprovingManager) {
                    $appraisal->approving_manager_user_id = $employeeProfile->approving_manager_user_id;
                }

                if (! $appraisal->isDirty(['line_manager_user_id', 'approving_manager_user_id'])) {
                    return;
                }

                $approvingManagerChanged = $appraisal->isDirty('approving_manager_user_id');
                $appraisal->save();
                $updatedCount++;

                $this->forgetDashboardCaches($appraisal, [
                    $previousLineManagerId,
                    $previousApprovingManagerId,
                    $appraisal->line_manager_user_id,
                    $appraisal->approving_manager_user_id,
                    $appraisal->employee_user_id,
                ]);

                if ($approvingManagerChanged && $this->isAwaitingApproval($appraisal)) {
                    User::query()
                        ->find($appraisal->approving_manager_user_id)
                        ?->notify(new ApprovalRequestedNotification($appraisal));
                }
            });

        return $updatedCount;
    }

    /**
     * @param  list<int|null>  $userIds
     */
    private function forgetDashboardCaches(Appraisal $appraisal, array $userIds): void
    {
        foreach (array_unique(array_filter($userIds)) as $userId) {
            Cache::forget(
                "performance:dashboard:organization:{$appraisal->organization_id}:user:{$userId}",
            );
        }
    }

    private function isAwaitingApproval(Appraisal $appraisal): bool
    {
        return $appraisal->status === AppraisalStatus::ApprovalPending
            || (
                $appraisal->status === AppraisalStatus::SentBack
                && $appraisal->reopened_stage === WorkflowStage::Approval
            );
    }
}
