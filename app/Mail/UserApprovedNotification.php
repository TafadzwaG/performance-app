<?php

namespace App\Mail;

use App\Models\SystemSetting;
use App\Models\User;
use App\Support\Branding;
use App\Support\Tenancy\TenantAwareUrl;
use App\Tenancy\TenantContext;
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
        public ?int $organizationId = null,
        public ?string $organizationName = null,
        public array $roleNames = [],
    ) {
        $organization = app(TenantContext::class)->organization();
        $this->organizationId ??= $organization?->id;
        $this->organizationName ??= $organization?->name;
        $this->roleNames = $this->roleNames ?: $user->getRoleNames()->all();
    }

    public function envelope(): Envelope
    {
        $settings = SystemSetting::query()->first();
        $companyName = $this->organizationName ?? $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio');

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
                'companyName' => $this->organizationName ?? $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio'),
                'logoUrl' => Branding::logoUrl(),
                'loginUrl' => $this->organizationId
                    ? TenantAwareUrl::forOrganization($this->organizationId, route('dashboard'))
                    : route('login'),
                'approvedAt' => now(),
                'roles' => $this->roleNames,
            ],
        );
    }
}
