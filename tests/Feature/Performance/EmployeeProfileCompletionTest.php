<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function useTenantForProfileCompletion(Organization $organization): void
{
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
}

test('completing profile restores a soft deleted employee profile instead of inserting a duplicate', function () {
    $user = User::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $profile = EmployeeProfile::factory()->for($user)->create([
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'employee_number' => 'EMP-RESTORE-001',
        'gender' => 'female',
    ]);
    $profile->delete();

    $this->actingAs($user)
        ->post(route('employee-profile.complete.store'), [
            'employee_number' => 'EMP-RESTORE-001',
            'gender' => 'male',
            'department_id' => $department->id,
            'job_title_id' => $jobTitle->id,
            'employment_status' => 'active',
            'is_active' => true,
            'is_review_eligible' => true,
        ])
        ->assertRedirect(route('dashboard'));

    $profile->refresh();

    expect($profile->trashed())->toBeFalse()
        ->and($profile->gender)->toBe('male')
        ->and(EmployeeProfile::withTrashed()->where('user_id', $user->id)->count())->toBe(1);
});

test('user can complete profile in a second organization when they already have one elsewhere', function () {
    $user = User::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-FIRST-ORG',
    ]);

    $secondOrganization = Organization::query()->create([
        'name' => 'Second Tenant',
        'slug' => 'second-tenant-profile',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    useTenantForProfileCompletion($secondOrganization);

    Location::query()->create([
        'name' => 'Second Main',
        'code' => 'SECOND-MAIN',
        'timezone' => 'Africa/Johannesburg',
        'is_active' => true,
    ]);

    $user->memberships()->create([
        'organization_id' => $secondOrganization->id,
        'status' => 'active',
        'is_default' => false,
        'access_all_locations' => true,
        'invited_at' => now(),
        'activated_at' => now(),
    ]);

    Department::factory()->create(['organization_id' => $secondOrganization->id]);
    $secondDepartment = Department::factory()->create(['organization_id' => $secondOrganization->id]);
    $secondJobTitle = JobTitle::factory()->create(['organization_id' => $secondOrganization->id]);

    $this->actingAs($user)
        ->withSession(['organization_id' => $secondOrganization->id])
        ->post(route('employee-profile.complete.store'), [
            'employee_number' => 'EMP-SECOND-ORG',
            'gender' => 'male',
            'department_id' => $secondDepartment->id,
            'job_title_id' => $secondJobTitle->id,
            'employment_status' => 'active',
            'is_active' => true,
            'is_review_eligible' => true,
        ])
        ->assertRedirect(route('dashboard'));

    expect(EmployeeProfile::withoutGlobalScopes()->where('user_id', $user->id)->count())->toBe(2)
        ->and(EmployeeProfile::withoutGlobalScopes()
            ->where('user_id', $user->id)
            ->where('organization_id', $secondOrganization->id)
            ->value('employee_number'))->toBe('EMP-SECOND-ORG');
});
