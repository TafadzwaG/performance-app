<?php

use App\Models\EmployeeProfile;
use App\Models\Organization;
use App\Models\User;
use App\Tenancy\TenantContext;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;

function useTenantForSelection(Organization $organization): void
{
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
}

test('non platform users are sent to organization selection after login', function () {
    $user = User::factory()->create();
    EmployeeProfile::factory()->for($user)->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])
        ->assertRedirect(route('organizations.select'));

    $organization = $user->memberships()->first()->organization;

    $this->actingAs($user)
        ->get(route('organizations.select'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('organizations/Select')
            ->has('organizations', 1)
            ->where('currentOrganization.id', $organization->id));
});

test('organization selection shows continue action for default organization', function () {
    $user = User::factory()->create();
    EmployeeProfile::factory()->for($user)->create();
    $organization = $user->memberships()->first()->organization;

    $this->actingAs($user)
        ->get(route('organizations.select'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('currentOrganization.id', $organization->id)
            ->where('currentOrganization.name', $organization->name));
});

test('organization selection offers every active organization as a transfer target', function () {
    $user = User::factory()->create();
    $currentOrganization = $user->memberships()->first()->organization;
    $targetOrganization = Organization::query()->create([
        'name' => 'Transfer Target',
        'slug' => 'transfer-target',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    $this->actingAs($user)
        ->withSession(['organization_id' => $currentOrganization->id])
        ->get(route('organizations.select'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('organizations/Select')
            ->where('canTransferMembership', true)
            ->has('organizations', 2)
            ->where('organizations', function ($organizations) use ($currentOrganization, $targetOrganization) {
                $ids = collect($organizations)->pluck('id')->all();

                return in_array($currentOrganization->id, $ids, true)
                    && in_array($targetOrganization->id, $ids, true);
            }));
});

test('users can transfer their active membership to another organization', function () {
    $user = User::factory()->create();
    $currentMembership = $user->memberships()->firstOrFail();
    $targetOrganization = Organization::query()->create([
        'name' => 'New Membership Organization',
        'slug' => 'new-membership-organization',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    $this->actingAs($user)
        ->withSession(['organization_id' => $currentMembership->organization_id])
        ->post(route('organizations.transfer'), ['organization_id' => $targetOrganization->id])
        ->assertRedirect(route('employee-profile.complete'))
        ->assertSessionHas('success', 'Your membership was transferred to New Membership Organization.');

    $currentMembership->refresh();
    $targetMembership = $user->memberships()
        ->where('organization_id', $targetOrganization->id)
        ->firstOrFail();

    expect($currentMembership->status)->toBe('suspended')
        ->and($currentMembership->is_default)->toBeFalse()
        ->and($currentMembership->suspended_at)->not->toBeNull()
        ->and($targetMembership->status)->toBe('active')
        ->and($targetMembership->is_default)->toBeTrue()
        ->and($targetMembership->activated_at)->not->toBeNull()
        ->and(session('organization_id'))->toBe($targetOrganization->id);
});

test('membership transfer rejects suspended organizations', function () {
    $user = User::factory()->create();
    $currentMembership = $user->memberships()->firstOrFail();
    $suspendedOrganization = Organization::query()->create([
        'name' => 'Suspended Transfer Target',
        'slug' => 'suspended-transfer-target',
        'status' => 'suspended',
        'timezone' => 'Africa/Johannesburg',
    ]);

    $this->actingAs($user)
        ->post(route('organizations.transfer'), ['organization_id' => $suspendedOrganization->id])
        ->assertNotFound();

    expect($currentMembership->fresh()->status)->toBe('active')
        ->and($user->memberships()->where('organization_id', $suspendedOrganization->id)->exists())->toBeFalse();
});

test('users can transfer back to a previously suspended membership', function () {
    $user = User::factory()->create();
    $originalMembership = $user->memberships()->firstOrFail();
    $otherOrganization = Organization::query()->create([
        'name' => 'Temporary Membership Organization',
        'slug' => 'temporary-membership-organization',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    $this->actingAs($user)
        ->post(route('organizations.transfer'), ['organization_id' => $otherOrganization->id])
        ->assertRedirect(route('employee-profile.complete'));

    $this->actingAs($user)
        ->post(route('organizations.transfer'), ['organization_id' => $originalMembership->organization_id])
        ->assertRedirect(route('employee-profile.complete'));

    expect($originalMembership->fresh()->status)->toBe('active')
        ->and($originalMembership->fresh()->is_default)->toBeTrue()
        ->and($originalMembership->fresh()->suspended_at)->toBeNull()
        ->and($user->memberships()->where('organization_id', $originalMembership->organization_id)->count())->toBe(1)
        ->and($user->memberships()->where('organization_id', $otherOrganization->id)->firstOrFail()->status)->toBe('suspended');
});

test('platform admins cannot replace support access with a membership transfer', function () {
    $platformAdmin = User::factory()->create(['is_platform_admin' => true]);
    $targetOrganization = Organization::query()->create([
        'name' => 'Platform Transfer Target',
        'slug' => 'platform-transfer-target',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    $this->actingAs($platformAdmin)
        ->post(route('organizations.transfer'), ['organization_id' => $targetOrganization->id])
        ->assertForbidden();
});

test('users with multiple memberships can continue or switch organization', function () {
    $user = User::factory()->create();
    EmployeeProfile::factory()->for($user)->create();

    $organizationA = $user->memberships()->first()->organization;

    $organizationB = Organization::query()->create([
        'name' => 'Second Tenant',
        'slug' => 'second-tenant',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    useTenantForSelection($organizationB);

    $user->memberships()->create([
        'organization_id' => $organizationB->id,
        'status' => 'active',
        'is_default' => false,
        'access_all_locations' => true,
        'invited_at' => now(),
        'activated_at' => now(),
    ]);

    EmployeeProfile::factory()->for($user)->create([
        'organization_id' => $organizationB->id,
        'employee_number' => 'EMP-SECOND-001',
    ]);

    $this->actingAs($user)
        ->withSession(['organization_id' => $organizationA->id])
        ->get(route('organizations.select'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('organizations', 2)
            ->where('currentOrganization.id', $organizationA->id));

    $this->actingAs($user)
        ->post(route('organizations.switch'), ['organization_id' => $organizationB->id])
        ->assertRedirect(route('dashboard'));
});

test('platform admins still auto enter their default organization after login', function () {
    $user = User::factory()->create(['is_platform_admin' => true]);
    EmployeeProfile::factory()->for($user)->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard', absolute: false));
});
