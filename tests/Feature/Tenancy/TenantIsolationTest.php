<?php

use App\Models\Department;
use App\Models\EmployeeFieldSetting;
use App\Models\EmployeeProfile;
use App\Models\Location;
use App\Models\Organization;
use App\Models\Permission;
use App\Models\RatingScale;
use App\Models\User;
use App\Tenancy\TenantContext;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;

function useTenant(Organization $organization): void
{
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
}

function makeTenant(string $name, string $slug): array
{
    $organization = Organization::query()->create([
        'name' => $name,
        'slug' => $slug,
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    useTenant($organization);
    $location = Location::query()->create([
        'name' => 'Main Location',
        'code' => 'MAIN',
        'timezone' => 'Africa/Johannesburg',
        'is_active' => true,
    ]);

    return [$organization, $location];
}

test('tenant models and route binding cannot expose another organization', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTenant($organizationA);

    $admin = User::factory()->create(['is_approved' => true]);
    $locationA = Location::query()->firstOrFail();
    EmployeeProfile::factory()->for($admin)->create(['location_id' => $locationA->id]);
    Permission::findOrCreate('performance.setup.departments.view', 'web');
    $admin->givePermissionTo('performance.setup.departments.view');

    $departmentA = Department::query()->create(['name' => 'Operations', 'code' => 'OPS', 'is_active' => true]);

    [$organizationB] = makeTenant('Second Organization', 'second-organization');
    $departmentB = Department::query()->create(['name' => 'Operations', 'code' => 'OPS', 'is_active' => true]);

    useTenant($organizationA);

    expect(Department::query()->pluck('id'))->toContain($departmentA->id)
        ->not->toContain($departmentB->id);

    $this->actingAs($admin)
        ->withSession(['organization_id' => $organizationA->id])
        ->get(route('performance.setup.departments.show', $departmentB->id))
        ->assertNotFound();

    expect(Department::withoutGlobalScopes()->where('organization_id', $organizationB->id)->count())->toBe(1);
});

test('rating scales and employee field settings are shared across organizations', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTenant($organizationA);

    $ratingScale = RatingScale::query()->create([
        'name' => 'Shared Performance Scale',
        'code' => 'shared-performance-scale',
        'applies_to' => 'overall',
        'is_active' => true,
    ]);
    $level = $ratingScale->levels()->create([
        'label' => 'Achieved',
        'value' => 3,
        'sort_order' => 1,
        'is_default' => true,
    ]);
    $fieldSetting = EmployeeFieldSetting::query()->create([
        'screen_key' => 'shared-test-screen',
        'field_key' => 'shared-test-field',
        'is_enabled' => true,
        'is_required' => false,
        'display_order' => 1,
    ]);

    $organizationB = Organization::query()->create([
        'name' => 'Shared Configuration Organization',
        'slug' => 'shared-configuration-organization',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);
    useTenant($organizationB);

    expect(RatingScale::query()->find($ratingScale->id)?->id)->toBe($ratingScale->id)
        ->and($ratingScale->fresh()?->levels->pluck('id'))->toContain($level->id)
        ->and(EmployeeFieldSetting::query()->find($fieldSetting->id)?->id)->toBe($fieldSetting->id);

    EmployeeFieldSetting::query()
        ->whereKey($fieldSetting->id)
        ->update(['is_required' => true]);

    useTenant($organizationA);

    expect($fieldSetting->fresh()?->is_required)->toBeTrue();
});

test('organization switching rejects memberships that are missing or suspended', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTenant($organizationA);
    $user = User::factory()->create(['is_approved' => true]);

    [$organizationB] = makeTenant('Restricted Organization', 'restricted-organization');

    $this->actingAs($user)
        ->post(route('organizations.switch'), ['organization_id' => $organizationB->id])
        ->assertNotFound();

    $user->memberships()->create([
        'organization_id' => $organizationB->id,
        'status' => 'suspended',
        'is_default' => false,
        'access_all_locations' => true,
        'invited_at' => now(),
        'suspended_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('organizations.switch'), ['organization_id' => $organizationB->id])
        ->assertNotFound();
});

test('local administrators only receive employee records from assigned locations', function () {
    $organization = Organization::query()->firstOrFail();
    useTenant($organization);

    $locationA = Location::query()->firstOrFail();
    $locationB = Location::query()->create(['name' => 'Branch', 'code' => 'BRANCH', 'is_active' => true]);

    $admin = User::factory()->create(['is_approved' => true]);
    $admin->memberships()->where('organization_id', $organization->id)->update(['access_all_locations' => false]);
    $admin->locations()->sync([$locationA->id]);
    EmployeeProfile::factory()->for($admin)->create(['location_id' => $locationA->id]);

    Permission::findOrCreate('performance.employees.view', 'web');
    $admin->givePermissionTo('performance.employees.view');

    $visibleUser = User::factory()->create(['name' => 'Visible Employee']);
    EmployeeProfile::factory()->for($visibleUser)->create(['location_id' => $locationA->id]);
    $hiddenUser = User::factory()->create(['name' => 'Hidden Employee']);
    EmployeeProfile::factory()->for($hiddenUser)->create(['location_id' => $locationB->id]);

    $this->actingAs($admin)
        ->withSession(['organization_id' => $organization->id])
        ->get(route('performance.employees.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/employees/Index')
            ->has('employeeProfiles.data', 2)
            ->where('tenant.current.id', $organization->id)
            ->where('employeeProfiles.data.0.user.name', fn (string $name) => in_array($name, [$admin->name, 'Visible Employee'], true))
        );

    useTenant($organization);
    expect(EmployeeProfile::query()->where('user_id', $hiddenUser->id)->exists())->toBeFalse();
});
