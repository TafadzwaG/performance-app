<?php

namespace App\Mail;

use App\Models\SystemSetting;
use App\Models\User;
use App\Support\Branding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginOtpMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $code,
        public int $expiresInMinutes,
    ) {}

    public function envelope(): Envelope
    {
        $settings = SystemSetting::query()->first();
        $companyName = $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio');

        return new Envelope(
            subject: "{$companyName} sign-in verification code",
        );
    }

    public function content(): Content
    {
        $settings = SystemSetting::query()->first();

        return new Content(
            view: 'mail.auth.login-otp',
            with: [
                'user' => $this->user,
                'code' => $this->code,
                'expiresInMinutes' => $this->expiresInMinutes,
                'companyName' => $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio'),
                'logoUrl' => Branding::logoUrl(),
            ],
        );
    }
}
