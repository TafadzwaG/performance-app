<?php

namespace App\Listeners\Performance;

use App\Events\Performance\AppraisalStatusChanged;
use App\Notifications\Performance\AppraisalApprovedNotification;
use App\Notifications\Performance\AppraisalAssignedNotification;
use App\Notifications\Performance\AppraisalFinalizedNotification;
use App\Notifications\Performance\AppraisalSentBackNotification;
use App\Notifications\Performance\ApprovalRequestedNotification;
use App\Notifications\Performance\ManagerReviewRequestedNotification;
use App\Notifications\Performance\SelfAssessmentSubmittedNotification;
use Illuminate\Support\Collection;

class SendAppraisalWorkflowNotifications
{
    public function handle(AppraisalStatusChanged $event): void
    {
        $appraisal = $event->appraisal->loadMissing(['employee', 'lineManager', 'approvingManager']);

        match ($event->event) {
            'assigned' => $appraisal->employee?->notify(new AppraisalAssignedNotification($appraisal)),
            'self_submitted' => $appraisal->lineManager?->notify(new SelfAssessmentSubmittedNotification($appraisal)),
            'manager_review_requested' => $appraisal->lineManager?->notify(new ManagerReviewRequestedNotification($appraisal)),
            'approval_requested' => $appraisal->approvingManager?->notify(new ApprovalRequestedNotification($appraisal)),
            'approved' => $this->notifyMany([$appraisal->employee, $appraisal->lineManager], new AppraisalApprovedNotification($appraisal)),
            'sent_back' => $this->notifyMany([$appraisal->employee, $appraisal->lineManager], new AppraisalSentBackNotification($appraisal)),
            'finalized' => $this->notifyMany([$appraisal->employee, $appraisal->lineManager, $appraisal->approvingManager], new AppraisalFinalizedNotification($appraisal)),
            default => null,
        };
    }

    private function notifyMany(array $notifiables, object $notification): void
    {
        Collection::make($notifiables)
            ->filter()
            ->unique('id')
            ->each(fn ($notifiable) => $notifiable->notify($notification));
    }
}
