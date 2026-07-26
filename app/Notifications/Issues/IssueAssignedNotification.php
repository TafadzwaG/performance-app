<?php

namespace App\Notifications\Issues;

use App\Models\IssueReport;
use App\Notifications\Concerns\ActivatesTenantContext;
use App\Support\Tenancy\TenantAwareUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class IssueAssignedNotification extends Notification implements ShouldQueue
{
    use ActivatesTenantContext, Queueable;

    public function __construct(
        public readonly IssueReport $issue,
        public readonly ?string $note = null,
    ) {}

    public function via(object $notifiable): array
    {
        $this->activateTenantContext($this->issue->organization_id);

        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->greeting("Hello {$notifiable->name},")
            ->subject("Issue {$this->issue->reference} assigned")
            ->line("Reference: {$this->issue->reference}")
            ->line("Title: {$this->issue->title}")
            ->line("Type: {$this->issue->type->label()}")
            ->line("Status: {$this->issue->status->label()}")
            ->line('Reporter: '.($this->issue->reporter?->name ?? 'Unknown'))
            ->line('Assignee: '.($this->issue->assignee?->name ?? 'Unassigned'));

        if ($this->note) {
            $mail->line("Note: {$this->note}");
        }

        return $mail
            ->action('View issue', TenantAwareUrl::forOrganization($this->issue->organization_id, route('issues.show', $this->issue)))
            ->line('Please review the issue details and take the next action.');
    }
}
