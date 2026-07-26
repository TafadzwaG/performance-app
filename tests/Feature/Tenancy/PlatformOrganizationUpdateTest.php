<?php

use App\Models\Organization;
use App\Models\User;

test('platform admin can update an organization', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $organization = Organization::query()->firstOrFail();

    $this->actingAs($admin)
        ->patch(route('platform.organizations.update', $organization), [
            'name' => 'Updated Hotel Name',
            'slug' => $organization->slug,
            'timezone' => 'Africa/Harare',
            'email' => 'contact@hotel.test',
            'phone' => '+263 123 456',
            'website' => 'https://hotel.test',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $organization->refresh();

    expect($organization->name)->toBe('Updated Hotel Name')
        ->and($organization->timezone)->toBe('Africa/Harare')
        ->and($organization->email)->toBe('contact@hotel.test');
});

test('platform admin can view an organization', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $organization = Organization::query()->firstOrFail();

    $this->actingAs($admin)
        ->get(route('platform.organizations.show', $organization))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/organizations/Show')
            ->where('organization.id', $organization->id)
            ->where('organization.name', $organization->name)
            ->has('locations')
            ->has('memberships'));
});

test('non platform users cannot view organizations', function () {
    $user = User::factory()->create(['is_platform_admin' => false]);
    $organization = Organization::query()->firstOrFail();

    $this->actingAs($user)
        ->get(route('platform.organizations.show', $organization))
        ->assertForbidden();
});

test('non platform users cannot update organizations', function () {
    $user = User::factory()->create(['is_platform_admin' => false]);
    $organization = Organization::query()->firstOrFail();

    $this->actingAs($user)
        ->patch(route('platform.organizations.update', $organization), [
            'name' => 'Blocked Update',
            'slug' => $organization->slug,
            'timezone' => $organization->timezone,
        ])
        ->assertForbidden();
});
