<?php

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

test('platform admin can view memberships index with filters and stats', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);
    $member = User::factory()->create([
        'name' => 'Membership Test User',
        'email' => 'membership-test@example.com',
    ]);

    $this->actingAs($admin)
        ->get(route('platform.memberships.index', ['search' => $member->email]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('platform/memberships/Index')
            ->has('stats')
            ->has('organizationOptions')
            ->where('filters.search', $member->email)
            ->has('memberships.data', 1));
});

test('platform admin can export memberships to excel', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);

    $response = $this->actingAs($admin)
        ->get(route('platform.memberships.export', ['format' => 'xlsx']));

    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('platform-memberships-');
    expect($response->headers->get('content-type'))->toContain('spreadsheetml');
});

test('platform admin can export memberships to pdf', function () {
    $admin = User::factory()->create(['is_platform_admin' => true]);

    $response = $this->actingAs($admin)
        ->get(route('platform.memberships.export', ['format' => 'pdf']));

    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('platform-memberships-');
    expect($response->headers->get('content-type'))->toContain('pdf');
});

test('non platform users cannot access platform memberships', function () {
    $user = User::factory()->create(['is_platform_admin' => false]);

    $this->actingAs($user)
        ->get(route('platform.memberships.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('platform.memberships.export'))
        ->assertForbidden();
});
