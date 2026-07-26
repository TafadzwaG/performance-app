<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\DisasterRecovery\DisasterRecoveryService;
use App\Services\Performance\AppraisalWorkflowService;
use App\Services\Settings\MailSettingsService;
use App\Services\Settings\SystemOperationsService;
use App\Tenancy\TenantContext;
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
        $canManageInfrastructure = (bool) $request->user()->is_platform_admin;
        $canManageDisasterRecovery = $canManageInfrastructure && ($request->user()->can('system.disaster_recovery.manage') || $canManageSettings);
        $requestedTab = (string) $request->string('tab');
        $activeTab = match (true) {
            $requestedTab === 'operations' && $canManageInfrastructure => 'operations',
            $requestedTab === 'disaster-recovery' && $canManageDisasterRecovery => 'disaster-recovery',
            $canManageSettings => 'general',
            $canManageInfrastructure => 'operations',
            default => 'disaster-recovery',
        };
        $loadGeneralSettings = $activeTab === 'general' && $canManageSettings;
        $settings = $loadGeneralSettings ? SystemSetting::current() : null;
        $organization = $loadGeneralSettings ? app(TenantContext::class)->organization() : null;
        $tenantSettings = $loadGeneralSettings ? $organization->settings()->firstOrCreate() : null;

        return Inertia::render('settings/index', [
            'can' => [
                'manageSettings' => $canManageSettings,
                'manageDisasterRecovery' => $canManageDisasterRecovery,
                'manageInfrastructure' => $canManageInfrastructure,
            ],
            'operations' => $activeTab === 'operations' ? $operations->snapshot() : null,
            'disasterRecovery' => $activeTab === 'disaster-recovery' ? $disasterRecovery->snapshot() : null,
            'settings' => $loadGeneralSettings ? [
                'company_name' => $organization->name,
                'company_legal_name' => $tenantSettings->legal_name,
                'company_registration_number' => $tenantSettings->registration_number,
                'company_tax_number' => $tenantSettings->tax_number,
                'company_email' => $organization->email,
                'company_phone' => $organization->phone,
                'company_website' => $organization->website,
                ...$tenantSettings->only([
                    'address_line_1',
                    'address_line_2',
                    'city',
                    'state_province',
                    'postal_code',
                    'country',
                    'report_footer',
                ]),
                'calibration_enabled' => (bool) ($tenantSettings->calibration_enabled ?? true),
                ...($canManageInfrastructure ? $settings->only([
                    'smtp_host',
                    'smtp_port',
                    'smtp_username',
                    'smtp_encryption',
                    'mail_from_address',
                    'mail_from_name',
                    'mail_reply_to_address',
                    'mail_reply_to_name',
                    'mail_notifications_enabled',
                    'email_mfa_required',
                ]) : [
                    'smtp_host' => null,
                    'smtp_port' => null,
                    'smtp_username' => null,
                    'smtp_encryption' => null,
                    'mail_from_address' => null,
                    'mail_from_name' => $tenantSettings->mail_from_name,
                    'mail_reply_to_address' => $tenantSettings->mail_reply_to_address,
                    'mail_reply_to_name' => null,
                    'mail_notifications_enabled' => false,
                    'email_mfa_required' => false,
                ]),
                'smtp_password' => '',
                'smtp_password_set' => $canManageInfrastructure && filled($settings->smtp_password),
            ] : null,
        ]);
    }

    public function update(Request $request, AppraisalWorkflowService $workflowService): RedirectResponse
    {
        $validated = $this->validateSettings($request);
        $settings = SystemSetting::current();
        $organization = app(TenantContext::class)->organization();
        $tenantSettings = $organization->settings()->firstOrCreate();
        $wasCalibrationEnabled = (bool) ($tenantSettings->calibration_enabled ?? true);

        $organization->update([
            'name' => $validated['company_name'] ?? $organization->name,
            'email' => $validated['company_email'] ?? null,
            'phone' => $validated['company_phone'] ?? null,
            'website' => $validated['company_website'] ?? null,
        ]);
        $tenantSettings->update([
            'legal_name' => $validated['company_legal_name'] ?? null,
            'registration_number' => $validated['company_registration_number'] ?? null,
            'tax_number' => $validated['company_tax_number'] ?? null,
            'address_line_1' => $validated['address_line_1'] ?? null,
            'address_line_2' => $validated['address_line_2'] ?? null,
            'city' => $validated['city'] ?? null,
            'state_province' => $validated['state_province'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'country' => $validated['country'] ?? null,
            'report_footer' => $validated['report_footer'] ?? null,
            'calibration_enabled' => (bool) ($validated['calibration_enabled'] ?? true),
            'mail_from_name' => $validated['mail_from_name'] ?? null,
            'mail_reply_to_address' => $validated['mail_reply_to_address'] ?? null,
        ]);

        if ($request->user()->is_platform_admin) {
            $infrastructure = collect($validated)->only([
                'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption',
                'mail_from_address', 'mail_from_name', 'mail_reply_to_address', 'mail_reply_to_name',
                'mail_notifications_enabled', 'email_mfa_required',
            ])->all();

            if (! filled($infrastructure['smtp_password'] ?? null)) {
                unset($infrastructure['smtp_password']);
            }

            $settings->update($infrastructure);
        }

        $calibrationEnabled = (bool) ($validated['calibration_enabled'] ?? true);
        if ($wasCalibrationEnabled && ! $calibrationEnabled) {
            $workflowService->autoSkipPendingCalibrationsForCurrentTenant($request->user());
        }

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
            'company_name' => ['required', 'string', 'max:255'],
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
            'email_mfa_required' => ['required', 'boolean'],
            'calibration_enabled' => ['required', 'boolean'],
        ]);
    }
}
