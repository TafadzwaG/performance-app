<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;
use App\Support\Notifications\PerformanceNotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;

class CycleMilestoneReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Appraisal $appraisal,
        public readonly string $milestoneKey,
        public readonly string $milestoneLabel,
        public readonly Carbon $deadline,
        public readonly int $daysRemaining,
        public readonly string $actionUrl,
    ) {}

    public function via(object $notifiable): array
    {
        return PerformanceNotificationChannels::forAppraisalWorkflow();
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dueLabel = $this->daysRemaining === 0
            ? 'today'
            : ($this->daysRemaining === 1 ? 'tomorrow' : "in {$this->daysRemaining} days");

        return (new MailMessage)
            ->greeting("Hello {$notifiable->name},")
            ->subject("Milestone reminder — {$this->milestoneLabel} due {$dueLabel}")
            ->line("The {$this->milestoneLabel} milestone for {$this->appraisal->cycle_name_snapshot} is due {$dueLabel}.")
            ->line('Deadline: '.$this->deadline->format('d M Y'))
            ->line('Employee: '.$this->appraisal->employee_name_snapshot)
            ->line('Reference: '.($this->appraisal->employee_number_snapshot ?? 'N/A'))
            ->action('Open appraisal', $this->actionUrl)
            ->line('Please complete the required workflow step before the milestone deadline.');
    }

    public function toArray(object $notifiable): array
    {
        $dueLabel = $this->daysRemaining === 0
            ? 'today'
            : ($this->daysRemaining === 1 ? 'tomorrow' : "in {$this->daysRemaining} days");

        return [
            'title' => 'Milestone deadline approaching',
            'message' => "{$this->milestoneLabel} for {$this->appraisal->cycle_name_snapshot} is due {$dueLabel}.",
            'appraisal_id' => $this->appraisal->id,
            'milestone' => $this->milestoneKey,
            'milestone_label' => $this->milestoneLabel,
            'deadline' => $this->deadline->toDateString(),
            'days_remaining' => $this->daysRemaining,
            'employee' => $this->appraisal->employee_name_snapshot,
            'cycle' => $this->appraisal->cycle_name_snapshot,
            'route' => $this->actionUrl,
        ];
    }
}
