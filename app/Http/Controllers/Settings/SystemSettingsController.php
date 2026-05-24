<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\DisasterRecovery\DisasterRecoveryService;
use App\Services\Settings\MailSettingsService;
use App\Services\Settings\SystemOperationsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingsController extends Controller
{
    public function index(Request $request, SystemOperationsService $operations, DisasterRecoveryService $disasterRecovery): Response
    {
        abort_unless(
            $request->user()->can('system.settings.manage') || $request->user()->can('system.disaster_recovery.manage'),
            403,
        );

        $canManageSettings = $request->user()->can('system.settings.manage');
        $canManageDisasterRecovery = $request->user()->can('system.disaster_recovery.manage')
            || $canManageSettings;
        $settings = SystemSetting::current();

        return Inertia::render('settings/index', [
            'can' => [
                'manageSettings' => $canManageSettings,
                'manageDisasterRecovery' => $canManageDisasterRecovery,
            ],
            'operations' => $canManageSettings ? $operations->snapshot() : null,
            'disasterRecovery' => $canManageDisasterRecovery ? $disasterRecovery->snapshot() : null,
            'settings' => $canManageSettings ? [
                ...$settings->only([
                    'company_name',
                    'company_legal_name',
                    'company_registration_number',
                    'company_tax_number',
                    'company_email',
                    'company_phone',
                    'company_website',
                    'address_line_1',
                    'address_line_2',
                    'city',
                    'state_province',
                    'postal_code',
                    'country',
                    'report_footer',
                    'smtp_host',
                    'smtp_port',
                    'smtp_username',
                    'smtp_encryption',
                    'mail_from_address',
                    'mail_from_name',
                    'mail_reply_to_address',
                    'mail_reply_to_name',
                    'mail_notifications_enabled',
                ]),
                'smtp_password' => '',
                'smtp_password_set' => filled($settings->smtp_password),
            ] : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $this->validateSettings($request);
        $settings = SystemSetting::current();

        if (! filled($validated['smtp_password'] ?? null)) {
            unset($validated['smtp_password']);
        }

        $settings->update($validated);

        return to_route('settings.index')->with('success', 'System settings updated successfully.');
    }

    public function testEmail(Request $request, MailSettingsService $mailSettings): RedirectResponse
    {
        $validated = $request->validate([
            'test_email' => ['required', 'email', 'max:255'],
        ]);

        $mailSettings->apply();

        Mail::raw('This is a test email from your performance appraisal system settings.', function ($message) use ($validated) {
            $message->to($validated['test_email'])->subject('Performance appraisal test email');
        });

        return back()->with('success', 'Test email queued successfully.');
    }

    private function validateSettings(Request $request): array
    {
        return $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'company_legal_name' => ['nullable', 'string', 'max:255'],
            'company_registration_number' => ['nullable', 'string', 'max:255'],
            'company_tax_number' => ['nullable', 'string', 'max:255'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'company_phone' => ['nullable', 'string', 'max:255'],
            'company_website' => ['nullable', 'url', 'max:255'],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state_province' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'report_footer' => ['nullable', 'string', 'max:1000'],
            'smtp_host' => ['nullable', 'string', 'max:255'],
            'smtp_port' => ['nullable', 'integer', 'between:1,65535'],
            'smtp_username' => ['nullable', 'string', 'max:255'],
            'smtp_password' => ['nullable', 'string', 'max:255'],
            'smtp_encryption' => ['nullable', Rule::in(['tls', 'ssl', 'starttls', 'none'])],
            'mail_from_address' => ['nullable', 'email', 'max:255'],
            'mail_from_name' => ['nullable', 'string', 'max:255'],
            'mail_reply_to_address' => ['nullable', 'email', 'max:255'],
            'mail_reply_to_name' => ['nullable', 'string', 'max:255'],
            'mail_notifications_enabled' => ['required', 'boolean'],
        ]);
    }
}
