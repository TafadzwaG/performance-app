<?php

use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\Location;
use App\Models\Organization;
use App\Models\Permission;
use App\Models\RatingScale;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

test('authorized user can delete a non-protected template in their active organisation', function () {
    $organizationA = Organization::query()->firstOrFail();

    $organizationB = Organization::query()->create([
        'name' => 'Template Delete Org',
        'slug' => 'template-delete-org',
        'status' => 'active',
        'timezone' => 'Africa/Johannesburg',
    ]);

    app(TenantContext::class)->set($organizationB);

    Location::query()->create([
        'organization_id' => $organizationB->id,
        'name' => 'Main',
        'code' => 'MAIN',
        'timezone' => 'Africa/Johannesburg',
        'is_active' => true,
    ]);

    $ratingScale = RatingScale::factory()->create();

    $template = AppraisalTemplate::factory()->create([
        'organization_id' => $organizationB->id,
        'name' => 'Removable Template',
        'code' => 'removable-template',
        'objective_rating_scale_id' => $ratingScale->id,
        'competency_rating_scale_id' => $ratingScale->id,
        'overall_rating_scale_id' => $ratingScale->id,
        'is_protected' => false,
    ]);

    expect($organizationA->id)->not->toBe($organizationB->id);

    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.templates.view', 'web');
    Permission::findOrCreate('performance.templates.archive', 'web');

    app(PermissionRegistrar::class)->setPermissionsTeamId($organizationB->id);
    $user->givePermissionTo(['performance.templates.view', 'performance.templates.archive']);

    $user->memberships()->create([
        'organization_id' => $organizationB->id,
        'status' => 'active',
        'is_default' => true,
        'access_all_locations' => true,
        'invited_at' => now(),
        'activated_at' => now(),
    ]);

    EmployeeProfile::factory()->for($user)->create([
        'organization_id' => $organizationB->id,
        'location_id' => Location::query()->where('organization_id', $organizationB->id)->value('id'),
    ]);

    app(TenantContext::class)->clear();

    $this->actingAs($user)
        ->withSession(['organization_id' => $organizationB->id])
        ->delete(route('performance.templates.destroy', $template))
        ->assertRedirect(route('performance.templates.index'));

    expect(
        AppraisalTemplate::withoutGlobalScopes()
            ->withTrashed()
            ->find($template->id)
            ?->trashed()
    )->toBeTrue();
});
