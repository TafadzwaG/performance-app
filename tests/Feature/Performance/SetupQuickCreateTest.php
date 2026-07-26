<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Organization;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function quickSetupTenant(): Organization
{
    $organization = Organization::query()->firstOrFail();
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

    return $organization;
}

test('profile completion users can quick create departments and job titles', function () {
    quickSetupTenant();
    $user = User::factory()->create(['is_approved' => true]);

    $this->actingAs($user)
        ->postJson(route('performance.setup.departments.quick_store'), ['name' => 'Revenue Operations'])
        ->assertOk()
        ->assertJsonPath('option.label', 'Revenue Operations');

    $this->actingAs($user)
        ->postJson(route('performance.setup.job_titles.quick_store'), ['name' => 'Revenue Analyst'])
        ->assertOk()
        ->assertJsonPath('option.label', 'Revenue Analyst');

    expect(Department::query()->where('name', 'Revenue Operations')->exists())->toBeTrue()
        ->and(JobTitle::query()->where('name', 'Revenue Analyst')->exists())->toBeTrue();
});

test('users with existing profiles cannot quick create setup records without permission', function () {
    quickSetupTenant();
    $user = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson(route('performance.setup.departments.quick_store'), ['name' => 'Blocked Department'])
        ->assertForbidden();
});
