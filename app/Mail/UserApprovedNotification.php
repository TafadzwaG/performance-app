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

/**
 * Sent to a user once a Super Admin approves their account, giving them
 * confirmation and a direct sign-in link.
 */
class UserApprovedNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public ?User $approvedBy = null,
    ) {}

    public function envelope(): Envelope
    {
        $settings = SystemSetting::query()->first();
        $companyName = $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio');

        return new Envelope(
            subject: "Welcome to {$companyName} — your account is approved",
        );
    }

    public function content(): Content
    {
        $settings = SystemSetting::query()->first();

        return new Content(
            view: 'mail.users.approved',
            with: [
                'user' => $this->user,
                'approvedBy' => $this->approvedBy,
                'settings' => $settings,
                'companyName' => $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio'),
                'logoUrl' => Branding::logoUrl(),
                'loginUrl' => route('login'),
                'approvedAt' => now(),
                'roles' => $this->user->roles->pluck('name')->all(),
            ],
        );
    }
}
