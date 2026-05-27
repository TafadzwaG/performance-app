<?php

namespace App\Services\Performance;

use App\Enums\WorkflowStage;
use App\Events\Performance\AppraisalStatusChanged;
use App\Models\Appraisal;
use App\Models\Permission;
use App\Models\User;
use App\Notifications\Performance\AppraisalAssignedNotification;
use App\Notifications\Performance\AppraisalFinalizationRequestedNotification;
use App\Notifications\Performance\AppraisalFinalizedNotification;
use App\Notifications\Performance\AppraisalSentBackNotification;
use App\Notifications\Performance\AppraisalStepCompletedNotification;
use App\Notifications\Performance\ApprovalRequestedNotification;
use App\Notifications\Performance\CalibrationCompletedNotification;
use App\Notifications\Performance\CalibrationRequestedNotification;
use App\Notifications\Performance\SelfAssessmentSubmittedNotification;
use Illuminate\Support\Collection;

class AppraisalWorkflowNotificationService
{
    public function handle(AppraisalStatusChanged $event): void
    {
        $appraisal = $event->appraisal->loadMissing(['employee', 'lineManager', 'approvingManager']);

        match ($event->event) {
            'assigned' => $appraisal->employee?->notify(new AppraisalAssignedNotification($appraisal)),
            'goal_plan_submitted' => $this->notifyGoalPlanSubmitted($appraisal, $event->actor),
            'self_submitted' => $this->notifySelfAssessmentSubmitted($appraisal, $event->actor),
            'approval_requested' => $this->notifyManagerReviewSubmitted($appraisal, $event->actor),
            'calibration_requested' => $this->notifyApprovalSubmitted($appraisal, $event->actor),
            'calibration_completed' => $this->notifyCalibrationCompleted($appraisal, $event->actor),
            'finalized' => $this->notifyFinalized($appraisal, $event->actor),
            'sent_back' => $this->notifySentBack($appraisal, $event->actor),
            default => null,
        };
    }

    private function notifyGoalPlanSubmitted(Appraisal $appraisal, ?User $actor): void
    {
        $employee = $actor ?? $appraisal->employee;

        if ($employee === null) {
            return;
        }

        $employee->notify(AppraisalStepCompletedNotification::make(
            $appraisal,
            'Goal plan',
            "Your goal plan for {$appraisal->cycle_name_snapshot} has been submitted. Continue with your self assessment when you are ready.",
        ));
    }

    private function notifySelfAssessmentSubmitted(Appraisal $appraisal, ?User $actor): void
    {
        $employee = $actor ?? $appraisal->employee;

        if ($employee !== null) {
            $employee->notify(AppraisalStepCompletedNotification::make(
                $appraisal,
                'Self assessment',
                "Your self assessment for {$appraisal->cycle_name_snapshot} has been submitted successfully.",
            ));
        }

        if ($appraisal->lineManager !== null && $appraisal->lineManager->id !== $employee?->id) {
            $appraisal->lineManager->notify(new SelfAssessmentSubmittedNotification($appraisal));
        }
    }

    private function notifyManagerReviewSubmitted(Appraisal $appraisal, ?User $actor): void
    {
        $manager = $actor ?? $appraisal->lineManager;

        if ($manager !== null) {
            $manager->notify(AppraisalStepCompletedNotification::make(
                $appraisal,
                'Manager review',
                "You completed the manager review for {$appraisal->employee_name_snapshot} and forwarded the appraisal for approval.",
            ));
        }

        if ($appraisal->approvingManager !== null && $appraisal->approvingManager->id !== $manager?->id) {
            $appraisal->approvingManager->notify(new ApprovalRequestedNotification($appraisal));
        }
    }

    private function notifyApprovalSubmitted(Appraisal $appraisal, ?User $actor): void
    {
        $approver = $actor ?? $appraisal->approvingManager;

        if ($approver !== null) {
            $approver->notify(AppraisalStepCompletedNotification::make(
                $appraisal,
                'Approval',
                "You approved the appraisal for {$appraisal->employee_name_snapshot}. It is now awaiting calibration.",
            ));
        }

        $this->notifyCalibrators($appraisal);
    }

    private function notifyCalibrationCompleted(Appraisal $appraisal, ?User $actor): void
    {
        if ($actor !== null) {
            $actor->notify(AppraisalStepCompletedNotification::make(
                $appraisal,
                'Calibration',
                "Calibration for {$appraisal->employee_name_snapshot} has been recorded successfully.",
            ));
        }

        $this->notifyFinalizers($appraisal);

        $this->notifyMany(
            [$appraisal->employee, $appraisal->lineManager, $appraisal->approvingManager],
            new CalibrationCompletedNotification($appraisal),
        );
    }

    private function notifyFinalized(Appraisal $appraisal, ?User $actor): void
    {
        if ($actor !== null) {
            $actor->notify(AppraisalStepCompletedNotification::make(
                $appraisal,
                'Finalization',
                "The appraisal for {$appraisal->employee_name_snapshot} has been finalized.",
            ));
        }

        $this->notifyMany(
            [$appraisal->employee, $appraisal->lineManager, $appraisal->approvingManager],
            new AppraisalFinalizedNotification($appraisal),
        );
    }

    private function notifySentBack(Appraisal $appraisal, ?User $actor): void
    {
        if ($actor !== null) {
            $actor->notify(AppraisalStepCompletedNotification::make(
                $appraisal,
                'Send back',
                "The appraisal for {$appraisal->employee_name_snapshot} was sent back for correction.",
            ));
        }

        $nextActor = match ($appraisal->reopened_stage) {
            WorkflowStage::SelfAssessment => $appraisal->employee,
            WorkflowStage::ManagerReview => $appraisal->lineManager,
            WorkflowStage::Approval => $appraisal->approvingManager,
            default => null,
        };

        $recipients = Collection::make([$appraisal->employee, $nextActor])
            ->filter()
            ->unique('id')
            ->reject(fn (User $user) => $actor !== null && $user->id === $actor->id);

        $this->notifyMany($recipients->all(), new AppraisalSentBackNotification($appraisal));
    }

    private function notifyCalibrators(Appraisal $appraisal): void
    {
        if (! Permission::query()->where('name', 'performance.appraisals.calibrate')->where('guard_name', 'web')->exists()) {
            return;
        }

        $calibrators = User::permission('performance.appraisals.calibrate')->get();

        $this->notifyMany($calibrators->all(), new CalibrationRequestedNotification($appraisal));
    }

    private function notifyFinalizers(Appraisal $appraisal): void
    {
        if (! Permission::query()->where('name', 'performance.appraisals.finalize')->where('guard_name', 'web')->exists()) {
            return;
        }

        $finalizers = User::permission('performance.appraisals.finalize')->get();

        $this->notifyMany($finalizers->all(), new AppraisalFinalizationRequestedNotification($appraisal));
    }

    /**
     * @param  array<int, User|null>  $notifiables
     */
    private function notifyMany(array $notifiables, object $notification): void
    {
        Collection::make($notifiables)
            ->filter()
            ->unique('id')
            ->each(fn (User $notifiable) => $notifiable->notify($notification));
    }
}
