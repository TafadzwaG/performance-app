<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

abstract class AbstractAppraisalNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Appraisal $appraisal,
        protected string $title,
        protected string $message,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'appraisal_id' => $this->appraisal->id,
            'status' => $this->appraisal->status?->value,
            'employee' => $this->appraisal->employee_name_snapshot,
            'cycle' => $this->appraisal->cycle_name_snapshot,
            'route' => route('performance.appraisals.show', $this->appraisal),
        ];
    }
}
