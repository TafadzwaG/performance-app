<?php

use App\Models\AuditTrail;
use App\Models\Organization;
use App\Models\User;
use App\Tenancy\TenantContext;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;

function useTenantForSwitcher(Organization $organization): void
{
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
}

function makeSwitcherTenant(string $name, string $slug): Organization
{
    $organization = Organization::query()->create([
        'name' => $name,
        'slug' => $slug,
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    useTenantForSwitcher($organization);

    return $organization;
}

test('platform admin can switch into an organization without membership', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTenantForSwitcher($organizationA);

    $platformAdmin = User::factory()->create([
        'is_approved' => true,
        'is_platform_admin' => true,
    ]);

    $organizationB = makeSwitcherTenant('Support Target Org', 'support-target-org');

    $this->actingAs($platformAdmin)
        ->withSession(['organization_id' => $organizationA->id])
        ->post(route('organizations.switch'), ['organization_id' => $organizationB->id])
        ->assertRedirect(route('dashboard'));

    expect(session('organization_id'))->toBe($organizationB->id)
        ->and(session('platform_support_reason'))->toBe('Tenant switched via app switcher');

    expect(
        AuditTrail::withoutGlobalScopes()
            ->where('organization_id', $organizationB->id)
            ->where('user_id', $platformAdmin->id)
            ->where('action', 'platform_support_enter')
            ->exists()
    )->toBeTrue();
});

test('platform admin membership switch clears support access reason', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTenantForSwitcher($organizationA);

    $platformAdmin = User::factory()->create([
        'is_approved' => true,
        'is_platform_admin' => true,
    ]);

    $organizationB = makeSwitcherTenant('Membership Target Org', 'membership-target-org');
    $platformAdmin->memberships()->create([
        'organization_id' => $organizationB->id,
        'status' => 'active',
        'is_default' => false,
        'access_all_locations' => true,
        'invited_at' => now(),
    ]);

    $this->actingAs($platformAdmin)
        ->withSession([
            'organization_id' => $organizationA->id,
            'platform_support_reason' => 'Tenant switched via app switcher',
        ])
        ->post(route('organizations.switch'), ['organization_id' => $organizationB->id])
        ->assertRedirect(route('dashboard'));

    expect(session('organization_id'))->toBe($organizationB->id)
        ->and(session('platform_support_reason'))->toBeNull();
});

test('non platform users still cannot switch into organizations they do not belong to', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTenantForSwitcher($organizationA);
    $user = User::factory()->create(['is_approved' => true]);

    $organizationB = makeSwitcherTenant('Forbidden Org', 'forbidden-org');

    $this->actingAs($user)
        ->withSession(['organization_id' => $organizationA->id])
        ->post(route('organizations.switch'), ['organization_id' => $organizationB->id])
        ->assertNotFound();
});

test('shared props list all active organizations for platform admins', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTenantForSwitcher($organizationA);

    $platformAdmin = User::factory()->create([
        'is_approved' => true,
        'is_platform_admin' => true,
    ]);

    $organizationB = makeSwitcherTenant('Listed Support Org', 'listed-support-org');
    useTenantForSwitcher($organizationA);

    $this->actingAs($platformAdmin)
        ->withSession(['organization_id' => $organizationA->id])
        ->get(route('organizations.select'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('organizations/Select')
            ->has('organizations')
            ->where('organizations', function ($organizations) use ($organizationA, $organizationB) {
                $ids = collect($organizations)->pluck('id')->all();

                return in_array($organizationA->id, $ids, true)
                    && in_array($organizationB->id, $ids, true);
            })
            ->where('tenant.organizations', function ($organizations) use ($organizationA, $organizationB) {
                $ids = collect($organizations)->pluck('id')->all();

                return in_array($organizationA->id, $ids, true)
                    && in_array($organizationB->id, $ids, true);
            })
        );
});
