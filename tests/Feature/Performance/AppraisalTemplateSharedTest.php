<?php

use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\Location;
use App\Models\Organization;
use App\Models\Permission;
use App\Models\RatingScale;
use App\Models\User;
use App\Tenancy\TenantContext;
use Database\Seeders\PerformanceSetupSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function useTemplateTenant(Organization $organization): void
{
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
}

test('user can browse and import a template from another organisation they can access', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTemplateTenant($organizationA);
    $this->seed(PerformanceSetupSeeder::class);

    $sourceTemplate = AppraisalTemplate::query()
        ->where('code', 'monomotapa-performance-appraisal')
        ->firstOrFail();

    $organizationB = Organization::query()->create([
        'name' => 'Second Organisation',
        'slug' => 'second-organisation-templates',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    useTemplateTenant($organizationB);
    $this->seed(PerformanceSetupSeeder::class);

    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.templates.view', 'web');
    Permission::findOrCreate('performance.templates.create', 'web');

    app(PermissionRegistrar::class)->setPermissionsTeamId($organizationB->id);
    $user->givePermissionTo(['performance.templates.view', 'performance.templates.create']);

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
        'location_id' => Location::query()->where('organization_id', $organizationB->id)->value('id'),
    ]);

    useTemplateTenant($organizationB);

    $this->actingAs($user)
        ->withSession(['organization_id' => $organizationB->id])
        ->get(route('performance.templates.index', ['source_organization_id' => $organizationA->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/templates/Index')
            ->where('selectedSourceOrganization.id', $organizationA->id)
            ->has('sharedTemplates.data', 1)
            ->where('sharedTemplates.data.0.id', $sourceTemplate->id));

    $response = $this->actingAs($user)
        ->withSession(['organization_id' => $organizationB->id])
        ->post(route('performance.templates.shared.import', [
            'organization' => $organizationA->id,
            'template' => $sourceTemplate->id,
        ]));

    $response->assertSessionHasNoErrors()
        ->assertRedirect(route('performance.templates.index'));

    $imported = AppraisalTemplate::query()
        ->where('name', 'like', '%Imported%')
        ->first();

    expect($imported)->not->toBeNull()
        ->and($imported->organization_id)->toBe($organizationB->id)
        ->and($imported->items()->count())->toBe($sourceTemplate->items()->count());
});

test('import reuses the rating scales shared by all organisations', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTemplateTenant($organizationA);
    $this->seed(PerformanceSetupSeeder::class);

    $sourceTemplate = AppraisalTemplate::query()
        ->where('code', 'monomotapa-performance-appraisal')
        ->firstOrFail();
    $sharedScaleIds = collect([
        $sourceTemplate->objective_rating_scale_id,
        $sourceTemplate->competency_rating_scale_id,
        $sourceTemplate->overall_rating_scale_id,
    ])->sort()->values();

    $organizationB = Organization::query()->create([
        'name' => 'Bare Organisation',
        'slug' => 'bare-organisation-templates',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    useTemplateTenant($organizationB);
    Location::query()->create([
        'name' => 'Main',
        'code' => 'MAIN',
        'timezone' => 'Africa/Johannesburg',
        'is_active' => true,
    ]);

    expect(RatingScale::query()
        ->whereKey($sharedScaleIds)
        ->pluck('id')
        ->sort()
        ->values()
        ->all())->toBe($sharedScaleIds->all());

    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.templates.view', 'web');
    Permission::findOrCreate('performance.templates.create', 'web');

    app(PermissionRegistrar::class)->setPermissionsTeamId($organizationB->id);
    $user->givePermissionTo(['performance.templates.view', 'performance.templates.create']);

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
        'location_id' => Location::query()->where('organization_id', $organizationB->id)->value('id'),
    ]);

    useTemplateTenant($organizationB);

    $this->actingAs($user)
        ->withSession(['organization_id' => $organizationB->id])
        ->post(route('performance.templates.shared.import', [
            'organization' => $organizationA->id,
            'template' => $sourceTemplate->id,
        ]))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $imported = AppraisalTemplate::query()
        ->where('name', 'like', '%Imported%')
        ->firstOrFail();

    expect(collect([
        $imported->objective_rating_scale_id,
        $imported->competency_rating_scale_id,
        $imported->overall_rating_scale_id,
    ])->sort()->values()->all())->toBe($sharedScaleIds->all());
});

test('user cannot import a template from an organisation they cannot access', function () {
    $organizationA = Organization::query()->firstOrFail();
    useTemplateTenant($organizationA);
    $this->seed(PerformanceSetupSeeder::class);

    $sourceTemplate = AppraisalTemplate::query()->firstOrFail();

    $organizationB = Organization::query()->create([
        'name' => 'Isolated Organisation',
        'slug' => 'isolated-organisation-templates',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    useTemplateTenant($organizationB);
    $this->seed(PerformanceSetupSeeder::class);

    $user = User::factory()->create(['is_approved' => true]);
    $user->memberships()->where('organization_id', $organizationA->id)->delete();
    $user->memberships()->create([
        'organization_id' => $organizationB->id,
        'status' => 'active',
        'is_default' => true,
        'access_all_locations' => true,
        'invited_at' => now(),
        'activated_at' => now(),
    ]);
    Permission::findOrCreate('performance.templates.view', 'web');
    Permission::findOrCreate('performance.templates.create', 'web');

    app(PermissionRegistrar::class)->setPermissionsTeamId($organizationB->id);
    $user->givePermissionTo(['performance.templates.view', 'performance.templates.create']);

    EmployeeProfile::factory()->for($user)->create([
        'organization_id' => $organizationB->id,
        'location_id' => Location::query()->where('organization_id', $organizationB->id)->value('id'),
    ]);

    useTemplateTenant($organizationB);

    $this->actingAs($user)
        ->withSession(['organization_id' => $organizationB->id])
        ->post(route('performance.templates.shared.import', [
            'organization' => $organizationA->id,
            'template' => $sourceTemplate->id,
        ]))
        ->assertForbidden();
});
