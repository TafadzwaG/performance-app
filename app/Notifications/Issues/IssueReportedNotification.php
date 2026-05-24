<?php

namespace App\Notifications\Issues;

use App\Models\IssueReport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class IssueReportedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly IssueReport $issue,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->baseMail($notifiable)
            ->subject("Issue {$this->issue->reference} received")
            ->line('Your issue has been logged and is pending review.')
            ->line("Type: {$this->issue->type->label()}")
            ->line("Status: {$this->issue->status->label()}");
    }

    protected function baseMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->greeting("Hello {$notifiable->name},")
            ->line("Reference: {$this->issue->reference}")
            ->line("Title: {$this->issue->title}")
            ->action('View issue', route('issues.show', $this->issue))
            ->line('You will receive updates when the issue is assigned or progresses.');
    }
}
