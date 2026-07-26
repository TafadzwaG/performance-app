<?php

use App\Models\EmployeeProfile;
use App\Models\Organization;
use App\Models\Role;
use App\Models\User;
use App\Tenancy\TenantContext;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function bulkRoleTenant(): Organization
{
    test()->seed(DatabaseSeeder::class);

    $organization = Organization::query()->where('status', 'active')->firstOrFail();
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

    return $organization;
}

test('super admin can bulk replace roles for selected users', function () {
    $organization = bulkRoleTenant();

    $superAdminRole = Role::query()->where('name', 'Super Admin')->firstOrFail();
    $employeeRole = Role::query()->where('name', 'Employee')->firstOrFail();
    $managerRole = Role::query()->where('name', 'Manager')->firstOrFail();

    $superAdmin = User::factory()->create(['is_approved' => true]);
    $superAdmin->assignRole($superAdminRole);
    EmployeeProfile::factory()->for($superAdmin)->create(['organization_id' => $organization->id]);

    $targetA = User::factory()->create(['name' => 'Target A', 'is_approved' => true]);
    $targetA->assignRole($employeeRole);
    EmployeeProfile::factory()->for($targetA)->create(['organization_id' => $organization->id]);

    $targetB = User::factory()->create(['name' => 'Target B', 'is_approved' => true]);
    $targetB->assignRole($employeeRole);
    EmployeeProfile::factory()->for($targetB)->create(['organization_id' => $organization->id]);

    $this->actingAs($superAdmin)
        ->withSession(['organization_id' => $organization->id])
        ->post(route('access.users.bulk_roles'), [
            'apply_to_filter' => false,
            'user_ids' => [$targetA->id, $targetB->id],
            'role_ids' => [$managerRole->id],
            'mode' => 'replace',
            'approval_status' => 'active',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($targetA->fresh()->hasRole($managerRole))->toBeTrue()
        ->and($targetA->fresh()->hasRole($employeeRole))->toBeFalse()
        ->and($targetB->fresh()->hasRole($managerRole))->toBeTrue();
});

test('super admin can bulk add roles for all matching users', function () {
    $organization = bulkRoleTenant();

    $superAdminRole = Role::query()->where('name', 'Super Admin')->firstOrFail();
    $employeeRole = Role::query()->where('name', 'Employee')->firstOrFail();
    $managerRole = Role::query()->where('name', 'Manager')->firstOrFail();

    $superAdmin = User::factory()->create(['is_approved' => true]);
    $superAdmin->assignRole($superAdminRole);
    EmployeeProfile::factory()->for($superAdmin)->create(['organization_id' => $organization->id]);

    $target = User::factory()->create(['name' => 'Bulk Target', 'is_approved' => true]);
    $target->assignRole($employeeRole);
    EmployeeProfile::factory()->for($target)->create(['organization_id' => $organization->id]);

    $this->actingAs($superAdmin)
        ->withSession(['organization_id' => $organization->id])
        ->post(route('access.users.bulk_roles'), [
            'apply_to_filter' => true,
            'role_ids' => [$managerRole->id],
            'mode' => 'add',
            'approval_status' => 'active',
            'search' => 'Bulk Target',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($target->fresh()->hasRole($employeeRole))->toBeTrue()
        ->and($target->fresh()->hasRole($managerRole))->toBeTrue();
});

test('non super admin users cannot bulk assign roles', function () {
    $organization = bulkRoleTenant();

    $hrRole = Role::query()->where('name', 'HR Admin')->firstOrFail();
    $managerRole = Role::query()->where('name', 'Manager')->firstOrFail();

    $hrUser = User::factory()->create(['is_approved' => true]);
    $hrUser->assignRole($hrRole);
    EmployeeProfile::factory()->for($hrUser)->create(['organization_id' => $organization->id]);

    $target = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($target)->create(['organization_id' => $organization->id]);

    $this->actingAs($hrUser)
        ->withSession(['organization_id' => $organization->id])
        ->post(route('access.users.bulk_roles'), [
            'apply_to_filter' => false,
            'user_ids' => [$target->id],
            'role_ids' => [$managerRole->id],
            'mode' => 'replace',
            'approval_status' => 'active',
        ])
        ->assertForbidden();
});

test('users index exposes bulk role assignment flag for super admins only', function () {
    $organization = bulkRoleTenant();

    $superAdminRole = Role::query()->where('name', 'Super Admin')->firstOrFail();

    $superAdmin = User::factory()->create(['is_approved' => true]);
    $superAdmin->assignRole($superAdminRole);
    EmployeeProfile::factory()->for($superAdmin)->create(['organization_id' => $organization->id]);

    $plainUser = User::factory()->create(['is_approved' => true]);
    $plainUser->assignRole(Role::query()->where('name', 'HR Admin')->firstOrFail());
    EmployeeProfile::factory()->for($plainUser)->create(['organization_id' => $organization->id]);

    $this->actingAs($superAdmin)
        ->withSession(['organization_id' => $organization->id])
        ->get(route('access.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('canBulkAssignRoles', true));

    $this->actingAs($plainUser)
        ->withSession(['organization_id' => $organization->id])
        ->get(route('access.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('canBulkAssignRoles', false));
});
