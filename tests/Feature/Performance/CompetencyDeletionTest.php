<?php

use App\Enums\CompetencyCategory;
use App\Models\Competency;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('users with archive permission can delete values from competency setup', function () {
    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.setup.competencies.archive', 'web');
    $user->givePermissionTo('performance.setup.competencies.archive');

    $value = Competency::create([
        'name' => 'Ownership',
        'code' => 'ownership',
        'category' => CompetencyCategory::Value,
        'description' => 'Accepts accountability.',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->delete(route('performance.setup.competencies.destroy', $value))
        ->assertRedirect(route('performance.setup.competencies.index'));

    expect(Competency::find($value->id))->toBeNull()
        ->and(Competency::withTrashed()->find($value->id)?->trashed())->toBeTrue();
});

test('competency index exposes archive permission for delete controls', function () {
    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.setup.competencies.view', 'web');
    Permission::findOrCreate('performance.setup.competencies.archive', 'web');
    $user->givePermissionTo(['performance.setup.competencies.view', 'performance.setup.competencies.archive']);

    $this->actingAs($user)
        ->get(route('performance.setup.competencies.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/setup/competencies/Index')
            ->where('can.archive', true)
        );
});
