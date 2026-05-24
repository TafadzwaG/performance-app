<?php

namespace App\Notifications\Auth;

use App\Models\SystemSetting;
use App\Support\Branding;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    /**
     * Build the mail representation of the notification.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        $settings = SystemSetting::query()->first();
        $companyName = $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio');
        $resetUrl = $this->resetUrl($notifiable);
        $expireMinutes = (int) (config('auth.passwords.'.config('auth.defaults.passwords').'.expire') ?? 60);

        return (new MailMessage)
            ->subject("{$companyName} password reset")
            ->view('mail.auth.reset-password', [
                'user' => $notifiable,
                'companyName' => $companyName,
                'logoUrl' => Branding::logoUrl(),
                'resetUrl' => $resetUrl,
                'expireMinutes' => $expireMinutes,
            ]);
    }
}
