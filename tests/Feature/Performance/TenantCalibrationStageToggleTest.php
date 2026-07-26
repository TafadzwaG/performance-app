<?php

use App\Enums\AppraisalStatus;
use App\Enums\WorkflowStage;
use App\Models\Organization;
use App\Models\Permission;
use App\Models\User;
use App\Services\Performance\AppraisalWorkflowConfig;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    $organization = Organization::query()->firstOrFail();
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
});

test('workflow config defaults to calibration enabled with all stages', function () {
    $config = app(AppraisalWorkflowConfig::class);

    expect($config->calibrationEnabled())->toBeTrue()
        ->and($config->isStageEnabled(WorkflowStage::Calibration))->toBeTrue()
        ->and($config->enabledStages())->toBe([
            WorkflowStage::GoalSetting,
            WorkflowStage::SelfAssessment,
            WorkflowStage::ManagerReview,
            WorkflowStage::Approval,
            WorkflowStage::Calibration,
            WorkflowStage::Finalization,
        ]);
});

test('workflow config omits calibration when disabled for the tenant', function () {
    $organization = app(TenantContext::class)->organization();
    $organization->settings()->firstOrCreate()->update(['calibration_enabled' => false]);

    $config = app(AppraisalWorkflowConfig::class);

    expect($config->calibrationEnabled())->toBeFalse()
        ->and($config->isStageEnabled(WorkflowStage::Calibration))->toBeFalse()
        ->and($config->enabledStages())->toBe([
            WorkflowStage::GoalSetting,
            WorkflowStage::SelfAssessment,
            WorkflowStage::ManagerReview,
            WorkflowStage::Approval,
            WorkflowStage::Finalization,
        ]);
});

test('approving with calibration disabled auto-skips calibration and allows finalize', function () {
    $organization = app(TenantContext::class)->organization();
    $organization->settings()->firstOrCreate()->update(['calibration_enabled' => false]);

    [$appraisal, $overallScale] = createAppraisalForCalibrationFlow();
    $approver = User::factory()->create(['is_approved' => true]);
    $finalizer = User::factory()->create(['is_approved' => true]);
    $appraisal->update(['approving_manager_user_id' => $approver->id]);
    grantCalibrationPermissions($approver, ['performance.appraisals.approve']);
    grantCalibrationPermissions($finalizer, ['performance.appraisals.finalize']);

    $this->actingAs($approver)
        ->withSession(['organization_id' => $organization->id])
        ->post(route('performance.appraisals.approval.store', $appraisal), [
            'decision' => 'approve',
            'comment' => 'Approved without calibration.',
        ])
        ->assertRedirect();

    $appraisal->refresh();

    expect($appraisal->status)->toBe(AppraisalStatus::CalibrationPending)
        ->and($appraisal->approved_at)->not->toBeNull()
        ->and($appraisal->calibrated_at)->not->toBeNull()
        ->and($appraisal->calibrated_by_user_id)->toBeNull()
        ->and($appraisal->calibrated_overall_score)->not->toBeNull()
        ->and($appraisal->calibration_comment)->toContain('skipped')
        ->and($appraisal->overall_rating_scale_level_id)->toBe($overallScale['high']->id);

    $this->actingAs($finalizer)
        ->withSession(['organization_id' => $organization->id])
        ->post(route('performance.appraisals.finalize.store', $appraisal), [
            'comment' => 'Finalizing after auto-skip.',
        ])
        ->assertRedirect();

    expect($appraisal->fresh()->status)->toBe(AppraisalStatus::Finalized);
});

test('disabling calibration in settings advances in-flight calibration pending appraisals', function () {
    $organization = app(TenantContext::class)->organization();
    $organization->settings()->firstOrCreate()->update(['calibration_enabled' => true]);

    [$appraisal] = createAppraisalForCalibrationFlow([
        'status' => AppraisalStatus::CalibrationPending,
        'approved_at' => now(),
        'overall_score' => 88,
        'calibrated_at' => null,
    ]);

    $admin = User::factory()->create(['is_approved' => true, 'is_platform_admin' => true]);
    Permission::findOrCreate('system.settings.manage', 'web');
    $admin->givePermissionTo('system.settings.manage');
    $admin->memberships()->firstOrCreate(
        ['organization_id' => $organization->id],
        ['status' => 'active', 'is_default' => true, 'access_all_locations' => true, 'invited_at' => now()],
    );

    $this->actingAs($admin)
        ->withSession(['organization_id' => $organization->id])
        ->put(route('settings.update'), calibrationSettingsPayload(['calibration_enabled' => false]))
        ->assertRedirect(route('settings.index'));

    $appraisal->refresh();
    $tenantSettings = $organization->settings()->first();

    expect($tenantSettings->calibration_enabled)->toBeFalse()
        ->and($appraisal->calibrated_at)->not->toBeNull()
        ->and($appraisal->calibrated_overall_score)->not->toBeNull()
        ->and($appraisal->calibration_comment)->toContain('skipped');
});

test('settings page exposes calibration_enabled to authorized users', function () {
    $organization = app(TenantContext::class)->organization();
    $organization->settings()->firstOrCreate()->update(['calibration_enabled' => true]);

    $admin = User::factory()->create(['is_approved' => true, 'is_platform_admin' => true]);
    Permission::findOrCreate('system.settings.manage', 'web');
    $admin->givePermissionTo('system.settings.manage');
    $admin->memberships()->firstOrCreate(
        ['organization_id' => $organization->id],
        ['status' => 'active', 'is_default' => true, 'access_all_locations' => true, 'invited_at' => now()],
    );

    $this->actingAs($admin)
        ->withSession(['organization_id' => $organization->id])
        ->get(route('settings.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/index')
            ->where('settings.calibration_enabled', true)
        );
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function calibrationSettingsPayload(array $overrides = []): array
{
    return array_merge([
        'company_name' => 'TJT Appraisals',
        'company_legal_name' => null,
        'company_registration_number' => null,
        'company_tax_number' => null,
        'company_email' => null,
        'company_phone' => null,
        'company_website' => null,
        'address_line_1' => null,
        'address_line_2' => null,
        'city' => null,
        'state_province' => null,
        'postal_code' => null,
        'country' => null,
        'report_footer' => null,
        'smtp_host' => null,
        'smtp_port' => null,
        'smtp_username' => null,
        'smtp_password' => '',
        'smtp_encryption' => null,
        'mail_from_address' => null,
        'mail_from_name' => null,
        'mail_reply_to_address' => null,
        'mail_reply_to_name' => null,
        'mail_notifications_enabled' => false,
        'email_mfa_required' => false,
        'calibration_enabled' => true,
    ], $overrides);
}
