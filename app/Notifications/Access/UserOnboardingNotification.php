<?php

namespace App\Notifications\Access;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserOnboardingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $plainPassword,
        public readonly bool $forcePasswordChange,
        public readonly ?string $createdByName = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Your account has been created')
            ->greeting("Hello {$notifiable->name},")
            ->line('An account has been created for you in the Performance Management System.')
            ->line("Email: {$notifiable->email}")
            ->line("Temporary password: {$this->plainPassword}");

        if ($this->createdByName) {
            $mail->line("Created by: {$this->createdByName}");
        }

        if ($this->forcePasswordChange) {
            $mail->line('You will be required to change this password the first time you sign in.');
        }

        return $mail
            ->action('Sign in to the system', route('login'))
            ->line('Keep this message secure and delete it after you have signed in successfully.');
    }
}
