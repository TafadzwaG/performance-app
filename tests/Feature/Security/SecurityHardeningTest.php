<?php

use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Models\AuditTrail;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\ReviewCycle;
use App\Models\Role;
use App\Models\User;
use App\Services\Performance\EvidenceStorageService;
use App\Services\Performance\ReportQueryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('objective evidence is stored on the private local disk', function () {
    Storage::fake('local');
    Storage::fake('public');

    $user = User::factory()->create(['is_approved' => true]);
    $profile = EmployeeProfile::factory()->for($user)->create();
    $cycle = ReviewCycle::factory()->create(['status' => 'open']);
    $appraisal = Appraisal::factory()->for($cycle, 'reviewCycle')->for($profile, 'employeeProfile')->create([
        'employee_user_id' => $user->id,
    ]);
    $objective = AppraisalObjective::factory()->for($appraisal)->create();

    $evidence = app(EvidenceStorageService::class)->storeFile(
        $objective,
        UploadedFile::fake()->create('evidence.pdf', 100, 'application/pdf'),
        $user,
    );

    expect($evidence->disk)->toBe('local');
    Storage::disk('local')->assertExists($evidence->path);
    Storage::disk('public')->assertMissing($evidence->path);
});

test('user update cannot assign permissions without assign_permissions permission', function () {
    $actor = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($actor)->create();
    $target = User::factory()->create(['is_approved' => true]);
    $permission = Permission::findOrCreate('performance.dashboard.view', 'web');

    grantSecurityPermissions($actor, ['access.users.view', 'access.users.update']);

    $this->actingAs($actor)
        ->put(route('access.users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'permission_ids' => [$permission->id],
        ])
        ->assertForbidden();

    expect($target->fresh()->permissions)->toBeEmpty();
});

test('user update cannot assign roles without assign_users permission', function () {
    $actor = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($actor)->create();
    $target = User::factory()->create(['is_approved' => true]);
    $role = Role::findOrCreate('Employee', 'web');

    grantSecurityPermissions($actor, ['access.users.view', 'access.users.update']);

    $this->actingAs($actor)
        ->put(route('access.users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'role_ids' => [$role->id],
        ])
        ->assertForbidden();

    expect($target->fresh()->roles)->toBeEmpty();
});

test('dashboard overdue counts are scoped to visible appraisals', function () {
    $employee = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($employee)->create();

    $otherEmployee = User::factory()->create(['is_approved' => true]);
    $otherProfile = EmployeeProfile::factory()->for($otherEmployee)->create();

    $cycle = ReviewCycle::factory()->create([
        'status' => 'open',
        'self_assessment_deadline' => now()->subDay()->toDateString(),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for($otherProfile, 'employeeProfile')->create([
        'employee_user_id' => $otherEmployee->id,
        'status' => 'self_assessment_pending',
    ]);

    grantSecurityPermissions($employee, ['performance.dashboard.view']);

    $dashboard = app(ReportQueryService::class)->dashboard($employee);

    expect($dashboard['metrics']['overdue_reviews'])->toBe(0);
});

test('users without employee profiles are redirected from performance routes', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantSecurityPermissions($user, ['performance.appraisals.view']);

    $this->actingAs($user)
        ->get(route('performance.appraisals.index'))
        ->assertRedirect(route('employee-profile.complete'));
});

test('review cycle update rejects status changes through the form', function () {
    $user = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($user)->create();
    grantSecurityPermissions($user, ['performance.review_cycles.view', 'performance.review_cycles.update']);

    $cycle = ReviewCycle::factory()->create(['status' => 'draft']);

    $this->actingAs($user)
        ->put(route('performance.review_cycles.update', $cycle), [
            'name' => $cycle->name,
            'code' => $cycle->code,
            'start_date' => $cycle->start_date->toDateString(),
            'end_date' => $cycle->end_date->toDateString(),
            'status' => 'open',
        ])
        ->assertSessionHasErrors('status');

    expect($cycle->fresh()->status?->value)->toBe('draft');
});

test('super admin accounts cannot be impersonated', function () {
    $impersonator = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($impersonator)->create();
    grantSecurityPermissions($impersonator, ['access.users.impersonate']);

    $superAdmin = User::factory()->create(['is_approved' => true]);
    Role::findOrCreate('Super Admin', 'web');
    $superAdmin->assignRole('Super Admin');

    $this->actingAs($impersonator)
        ->post(route('access.users.impersonate.store', $superAdmin))
        ->assertForbidden();
});

test('audit trail omits one-time authentication codes from stored payloads', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $this->actingAs($user)
        ->post(route('two-factor.verify'), [
            'code' => '123456',
        ]);

    $audit = AuditTrail::query()->latest('id')->first();

    expect($audit)->not->toBeNull()
        ->and($audit->request_payload)->not->toHaveKey('code');
});

test('employee profile show masks national id before sending to inertia', function () {
    $viewer = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($viewer)->create();
    grantSecurityPermissions($viewer, ['performance.employees.view']);

    $employee = User::factory()->create(['is_approved' => true]);
    $profile = EmployeeProfile::factory()->for($employee)->create([
        'national_id' => 'AB1234567890',
    ]);

    $this->actingAs($viewer)
        ->get(route('performance.employees.show', $profile))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('employeeProfile.national_id', '********7890'));
});

function grantSecurityPermissions(User $user, array $permissions): void
{
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);
}
