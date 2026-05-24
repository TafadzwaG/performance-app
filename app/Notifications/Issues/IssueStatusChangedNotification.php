<?php

namespace App\Notifications\Issues;

use App\Models\IssueReport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class IssueStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly IssueReport $issue,
        public readonly ?string $note = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->greeting("Hello {$notifiable->name},")
            ->subject("Issue {$this->issue->reference} updated")
            ->line("Reference: {$this->issue->reference}")
            ->line("Title: {$this->issue->title}")
            ->line("Type: {$this->issue->type->label()}")
            ->line("Status: {$this->issue->status->label()}")
            ->line('Reporter: '.($this->issue->reporter?->name ?? 'Unknown'))
            ->line('Assignee: '.($this->issue->assignee?->name ?? 'Unassigned'));

        if ($this->note) {
            $mail->line("Latest note: {$this->note}");
        }

        return $mail
            ->action('View issue', route('issues.show', $this->issue))
            ->line('This update reflects the latest issue workflow stage.');
    }
}
