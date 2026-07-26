<?php

use App\Enums\DisasterRecovery\BackupStatus;
use App\Enums\DisasterRecovery\BackupTrigger;
use App\Enums\DisasterRecovery\RestoreRequestStatus;
use App\Jobs\DisasterRecovery\RunDisasterRecoveryBackupJob;
use App\Jobs\DisasterRecovery\RunDisasterRecoveryRestoreJob;
use App\Models\DisasterRecoveryBackup;
use App\Models\DisasterRecoveryRestoreRequest;
use App\Models\EmployeeProfile;
use App\Models\User;
use App\Services\DisasterRecovery\BackupArchiveService;
use App\Support\Performance\PerformancePermissions;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function drUser(string $role): User
{
    $user = User::factory()->create([
        'is_approved' => true,
        'is_platform_admin' => $role === 'Super Admin',
    ]);
    $user->assignRole($role);
    EmployeeProfile::factory()->for($user)->create();

    return $user;
}

function disasterRecoverySettingsTab(): string
{
    return route('settings.index', ['tab' => 'disaster-recovery']);
}

test('disaster recovery permission is registered and super admin can view dashboard', function () {
    expect(PerformancePermissions::all())->toContain('system.disaster_recovery.manage');

    $this->actingAs(drUser('Super Admin'))
        ->get(route('settings.disaster_recovery.index'))
        ->assertRedirect(disasterRecoverySettingsTab());

    $this->actingAs(drUser('Super Admin'))
        ->get(disasterRecoverySettingsTab())
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/index')
            ->where('can.manageDisasterRecovery', true)
            ->has('disasterRecovery.backups')
            ->has('disasterRecovery.restoreRequests')
            ->has('disasterRecovery.restoreTests'));

    $this->actingAs(drUser('Employee'))
        ->get(disasterRecoverySettingsTab())
        ->assertForbidden();
});

test('manual backup request creates metadata and queues backup job', function () {
    Queue::fake();

    $admin = drUser('Super Admin');

    $this->actingAs($admin)
        ->post(route('settings.disaster_recovery.backups.store'))
        ->assertRedirect(disasterRecoverySettingsTab());

    $backup = DisasterRecoveryBackup::query()->first();

    expect($backup)->not->toBeNull()
        ->and($backup->status)->toBe(BackupStatus::Queued)
        ->and($backup->trigger)->toBe(BackupTrigger::Manual)
        ->and($backup->created_by_user_id)->toBe($admin->id);

    Queue::assertPushed(RunDisasterRecoveryBackupJob::class);
});

test('backup archive service targets offsite disk and excludes volatile paths', function () {
    config()->set('disaster_recovery.disk', 's3');
    config()->set('disaster_recovery.path', 'hr-backups');

    $service = app(BackupArchiveService::class);

    expect($service->diskName())->toBe('s3')
        ->and($service->archivePath('manual', now()))->toStartWith('hr-backups/manual/')
        ->and($service->includedPaths())->toContain(storage_path('app/private'))
        ->and($service->includedPaths())->toContain(storage_path('app/public'))
        ->and($service->excludedPaths())->toContain(storage_path('framework/cache'))
        ->and($service->excludedPaths())->toContain(storage_path('logs'))
        ->and($service->excludedPaths())->toContain(storage_path('app/disaster-recovery'));
});

test('restore approval requires another super admin and confirmation phrase', function () {
    Queue::fake();

    $requester = drUser('Super Admin');
    $approver = drUser('Super Admin');

    $backup = DisasterRecoveryBackup::factory()->create([
        'status' => BackupStatus::Completed,
        'trigger' => BackupTrigger::Manual,
        'checksum' => hash('sha256', 'archive'),
    ]);

    $this->actingAs($requester)
        ->post(route('settings.disaster_recovery.restores.store'), [
            'backup_id' => $backup->id,
            'notes' => 'Restore after failed import.',
        ])
        ->assertRedirect(disasterRecoverySettingsTab());

    $restore = DisasterRecoveryRestoreRequest::query()->first();

    expect($restore)->not->toBeNull()
        ->and($restore->status)->toBe(RestoreRequestStatus::PendingApproval)
        ->and($restore->requested_by_user_id)->toBe($requester->id);

    $this->actingAs($requester)
        ->post(route('settings.disaster_recovery.restores.approve', $restore), [
            'confirmation_phrase' => config('disaster_recovery.restore_confirmation_phrase'),
        ])
        ->assertForbidden();

    $this->actingAs($approver)
        ->post(route('settings.disaster_recovery.restores.approve', $restore), [
            'confirmation_phrase' => 'WRONG',
        ])
        ->assertSessionHasErrors('confirmation_phrase');

    $this->actingAs($approver)
        ->post(route('settings.disaster_recovery.restores.approve', $restore), [
            'confirmation_phrase' => config('disaster_recovery.restore_confirmation_phrase'),
        ])
        ->assertRedirect(disasterRecoverySettingsTab());

    $restore->refresh();

    expect($restore->status)->toBe(RestoreRequestStatus::Approved)
        ->and($restore->approved_by_user_id)->toBe($approver->id);

    Queue::assertPushed(RunDisasterRecoveryRestoreJob::class);
});

test('settings disaster recovery tab tolerates missing remote backup archives', function () {
    DisasterRecoveryBackup::factory()->create([
        'status' => BackupStatus::Completed,
        'trigger' => BackupTrigger::Manual,
        'disk' => 's3',
        'path' => 'hr-backups/manual/2026/05/28/dr-manual-20260528-100703.zip',
        'filename' => 'dr-manual-20260528-100703.zip',
    ]);

    $this->actingAs(drUser('Super Admin'))
        ->get(disasterRecoverySettingsTab())
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('disasterRecovery.backups.0.download_available', false));
});

test('disaster recovery frontend exposes dashboard and confirmation controls', function () {
    $sidebar = file_get_contents(resource_path('js/components/app-sidebar.tsx'));
    $panel = file_get_contents(resource_path('js/components/settings/disaster-recovery-panel.tsx'));
    $settingsPage = file_get_contents(resource_path('js/pages/settings/index.tsx'));
    $consoleRoutes = file_get_contents(base_path('routes/console.php'));

    expect($sidebar)->toContain('Settings')
        ->and($sidebar)->toContain('system.disaster_recovery.manage')
        ->and($panel)->toContain('Latest backups')
        ->and($panel)->toContain('Request restore')
        ->and($panel)->toContain('Approve restore')
        ->and($panel)->toContain('confirmation_phrase')
        ->and($settingsPage)->toContain('disaster-recovery')
        ->and($settingsPage)->toContain('DisasterRecoveryPanel')
        ->and($consoleRoutes)->toContain('dr:backup')
        ->and($consoleRoutes)->toContain('dr:restore-test');
});
