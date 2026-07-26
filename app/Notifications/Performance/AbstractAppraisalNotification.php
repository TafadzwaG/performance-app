<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;
use App\Notifications\Concerns\ActivatesTenantContext;
use App\Support\Notifications\PerformanceNotificationChannels;
use App\Support\Tenancy\TenantAwareUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

abstract class AbstractAppraisalNotification extends Notification implements ShouldQueue
{
    use ActivatesTenantContext, Queueable;

    public function __construct(
        protected Appraisal $appraisal,
        protected string $title,
        protected string $message,
    ) {}

    public function via(object $notifiable): array
    {
        $this->activateTenantContext($this->appraisal->organization_id);

        return PerformanceNotificationChannels::forAppraisalWorkflow();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->greeting("Hello {$notifiable->name},")
            ->subject("{$this->title} — {$this->appraisal->cycle_name_snapshot}")
            ->line($this->message)
            ->line('Employee: '.$this->appraisal->employee_name_snapshot)
            ->line('Cycle: '.$this->appraisal->cycle_name_snapshot)
            ->action('Open appraisal', TenantAwareUrl::forOrganization($this->appraisal->organization_id, route('performance.appraisals.show', $this->appraisal)))
            ->line('This is an automated notification from the performance appraisal system.');
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
            'route' => TenantAwareUrl::forOrganization($this->appraisal->organization_id, route('performance.appraisals.show', $this->appraisal)),
        ];
    }
}
