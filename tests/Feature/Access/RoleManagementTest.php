<?php

use App\Models\Organization;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Tenancy\TenantContext;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('a role can be updated without changing its name', function () {
    $this->seed(DatabaseSeeder::class);

    $organization = Organization::query()->where('status', 'active')->firstOrFail();
    useRoleManagementTenant($organization);

    $role = Role::query()->where('name', 'Manager')->firstOrFail();
    $adminRole = Role::query()->where('name', 'Super Admin')->firstOrFail();
    $user = User::factory()->create(['is_approved' => true]);
    $user->assignRole($adminRole);

    $this->actingAs($user)
        ->withSession(['organization_id' => $organization->id])
        ->put(route('access.roles.update', $role), [
            'name' => $role->name,
        ])
        ->assertRedirect(route('access.roles.show', $role))
        ->assertSessionHasNoErrors();

    expect($role->fresh()->name)->toBe('Manager');
});

test('role pages and updates are isolated to the selected organization', function () {
    $this->seed(DatabaseSeeder::class);

    $firstOrganization = Organization::query()->where('status', 'active')->firstOrFail();
    useRoleManagementTenant($firstOrganization);
    $foreignRole = Role::query()->where('name', 'Manager')->firstOrFail();
    $user = User::factory()->create(['is_approved' => true]);

    $selectedOrganization = Organization::query()->create([
        'name' => 'Selected Organization',
        'slug' => 'selected-organization',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    $user->memberships()->create([
        'organization_id' => $selectedOrganization->id,
        'status' => 'active',
        'is_default' => false,
        'access_all_locations' => true,
        'invited_at' => now(),
        'activated_at' => now(),
    ]);

    useRoleManagementTenant($selectedOrganization);

    $adminRole = Role::query()->create([
        'name' => 'Organization Administrator',
        'guard_name' => 'web',
    ]);
    $managerRole = Role::query()->create([
        'name' => 'Manager',
        'guard_name' => 'web',
    ]);

    Permission::findOrCreate('access.roles.view', 'web');
    Permission::findOrCreate('access.roles.update', 'web');
    $adminRole->syncPermissions(['access.roles.view', 'access.roles.update']);
    $user->assignRole($adminRole);

    $this->actingAs($user)
        ->withSession(['organization_id' => $selectedOrganization->id])
        ->get(route('access.roles.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('roles.data', fn ($roles) => collect($roles)->pluck('id')->all() === [
                $managerRole->id,
                $adminRole->id,
            ]));

    $this->actingAs($user)
        ->withSession(['organization_id' => $selectedOrganization->id])
        ->get(route('access.roles.edit', $foreignRole))
        ->assertNotFound();

    $this->actingAs($user)
        ->withSession(['organization_id' => $selectedOrganization->id])
        ->put(route('access.roles.update', $managerRole), [
            'name' => 'Manager',
        ])
        ->assertRedirect(route('access.roles.show', $managerRole))
        ->assertSessionHasNoErrors();
});

function useRoleManagementTenant(Organization $organization): void
{
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
}
