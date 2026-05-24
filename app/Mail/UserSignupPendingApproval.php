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
 * Sent to every Super Admin when a new user submits a registration request.
 * The applicant themselves is added as a CC so they have a paper trail too.
 */
class UserSignupPendingApproval extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $applicant,
    ) {}

    public function envelope(): Envelope
    {
        $settings = SystemSetting::query()->first();
        $companyName = $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio');

        return new Envelope(
            subject: "[{$companyName}] New signup awaiting approval — {$this->applicant->name}",
            cc: array_filter([$this->applicant->email]),
        );
    }

    public function content(): Content
    {
        $settings = SystemSetting::query()->first();

        return new Content(
            view: 'mail.users.signup-pending-approval',
            with: [
                'applicant' => $this->applicant,
                'settings' => $settings,
                'companyName' => $settings?->company_name ?? config('app.name', 'Performance Appraisal Studio'),
                'submittedAt' => $this->applicant->created_at,
                'logoUrl' => Branding::logoUrl(),
                'approvalUrl' => route('access.users.index', ['approval_status' => 'pending']),
            ],
        );
    }
}
