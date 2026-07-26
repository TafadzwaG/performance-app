<?php

use App\Models\EmployeeProfile;
use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use App\Tenancy\TenantContext;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;

function tenantPersistenceOrganization(string $name, string $slug): Organization
{
    return Organization::query()->create([
        'name' => $name,
        'slug' => $slug,
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);
}

function tenantPersistenceUser(Organization $organization): User
{
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

    Location::query()->firstOrCreate(
        ['organization_id' => $organization->id, 'code' => 'MAIN'],
        [
            'name' => 'Main',
            'timezone' => 'Africa/Johannesburg',
            'is_active' => true,
        ],
    );

    $user = User::factory()->create(['is_approved' => true]);
    $user->memberships()->where('organization_id', '!=', $organization->id)->delete();
    $user->memberships()->updateOrCreate(
        ['organization_id' => $organization->id],
        [
            'status' => 'active',
            'is_default' => false,
            'access_all_locations' => true,
            'invited_at' => now(),
            'activated_at' => now(),
        ],
    );
    EmployeeProfile::factory()->for($user)->create([
        'organization_id' => $organization->id,
        'location_id' => Location::query()->where('organization_id', $organization->id)->value('id'),
    ]);

    return $user;
}

test('switching organization persists across subsequent navigation', function () {
    test()->seed(DatabaseSeeder::class);

    $defaultOrganization = Organization::query()->where('status', 'active')->orderBy('id')->firstOrFail();
    $secondOrganization = tenantPersistenceOrganization('Carribean Bay', 'carribean-bay');

    $user = tenantPersistenceUser($defaultOrganization);
    $user->memberships()->create([
        'organization_id' => $secondOrganization->id,
        'status' => 'active',
        'is_default' => false,
        'access_all_locations' => true,
        'invited_at' => now(),
        'activated_at' => now(),
    ]);
    EmployeeProfile::factory()->for($user)->create([
        'organization_id' => $secondOrganization->id,
        'location_id' => Location::query()->where('organization_id', $secondOrganization->id)->value('id'),
    ]);

    $this->actingAs($user)
        ->withSession(['organization_id' => $defaultOrganization->id])
        ->post(route('organizations.switch'), ['organization_id' => $secondOrganization->id])
        ->assertRedirect();

    expect(session('organization_id'))->toBe($secondOrganization->id);

    $this->actingAs($user)
        ->withSession(['organization_id' => $secondOrganization->id])
        ->get(route('performance.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tenant.current.id', $secondOrganization->id)
            ->where('tenant.current.name', 'Carribean Bay'));

    $this->actingAs($user)
        ->withSession(['organization_id' => $secondOrganization->id])
        ->get(route('organizations.select'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('tenant.current.id', $secondOrganization->id));
});

test('invalid session organization does not silently fall back to default organization', function () {
    test()->seed(DatabaseSeeder::class);

    $defaultOrganization = Organization::query()->where('status', 'active')->orderBy('id')->firstOrFail();
    $secondOrganization = tenantPersistenceOrganization('Other Org', 'other-org');
    $user = tenantPersistenceUser($defaultOrganization);
    $user->memberships()->create([
        'organization_id' => $secondOrganization->id,
        'status' => 'active',
        'is_default' => true,
        'access_all_locations' => true,
        'invited_at' => now(),
        'activated_at' => now(),
    ]);

    $this->actingAs($user)
        ->withSession(['organization_id' => 999999])
        ->get(route('performance.dashboard'))
        ->assertRedirect(route('organizations.select'));

    expect(session()->has('organization_id'))->toBeFalse();
});
