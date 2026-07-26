<?php

use App\Models\Department;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Perspective;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

test('authorized user can update goal library weight via json endpoint', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('performance.goal_library.update');

    $item = GoalLibraryItem::factory()->create([
        'default_weight' => 25,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)
        ->patchJson(route('performance.goal_library.update_weight', $item), [
            'default_weight' => 30,
        ]);

    $response->assertOk()
        ->assertJson([
            'id' => $item->id,
            'default_weight' => 30,
        ]);

    expect((float) $item->fresh()->default_weight)->toBe(30.0);
});

test('authorized user can deactivate goal library item via json endpoint', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('performance.goal_library.archive');

    $item = GoalLibraryItem::factory()->create([
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)
        ->patchJson(route('performance.goal_library.deactivate', $item));

    $response->assertOk()
        ->assertJson([
            'id' => $item->id,
            'is_active' => false,
        ]);

    expect($item->fresh()->is_active)->toBeFalse();
});

test('authorized user can quick update goal library item via json endpoint', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('performance.goal_library.update');

    $item = GoalLibraryItem::factory()->create([
        'title' => 'Original KPI',
        'default_weight' => 25,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)
        ->patchJson(route('performance.goal_library.quick_update', $item), [
            'title' => 'Updated KPI',
            'default_weight' => 30,
        ]);

    $response->assertOk()
        ->assertJsonPath('item.title', 'Updated KPI')
        ->assertJsonPath('item.default_weight', 30);

    expect($item->fresh()->title)->toBe('Updated KPI');
});

test('authorized user can create goal library item via json store', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('performance.goal_library.create');

    $perspective = Perspective::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('performance.goal_library.store'), [
            'department_id' => $department->id,
            'job_title_id' => $jobTitle->id,
            'perspective_id' => $perspective->id,
            'title' => 'Modal KPI',
            'default_weight' => 20,
            'is_active' => true,
        ]);

    $response->assertCreated()
        ->assertJsonPath('item.title', 'Modal KPI');

    expect(GoalLibraryItem::query()->where('title', 'Modal KPI')->exists())->toBeTrue();
});

test('goal library quick endpoints reject unauthorized users', function () {
    $viewer = User::factory()->create();
    $viewer->givePermissionTo('performance.goal_library.view');
    $item = GoalLibraryItem::factory()->create();

    $this->actingAs($viewer)
        ->patchJson(route('performance.goal_library.update_weight', $item), ['default_weight' => 10])
        ->assertForbidden();

    $this->actingAs($viewer)
        ->patchJson(route('performance.goal_library.deactivate', $item))
        ->assertForbidden();
});
