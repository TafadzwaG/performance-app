<?php

use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authorized users can delete a review cycle and its attached appraisals', function () {
    $user = reviewCycleDeleteAdmin();
    $cycle = ReviewCycle::factory()->create(['name' => '2026 Annual Review']);
    $template = AppraisalTemplate::factory()->create();
    $profile = EmployeeProfile::factory()->for(User::factory()->create(['is_approved' => true]))->create();

    $appraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->for($template, 'template')
        ->create();

    $this->actingAs($user)
        ->delete(route('performance.review_cycles.destroy', $cycle))
        ->assertRedirect(route('performance.review_cycles.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('review_cycles', ['id' => $cycle->id]);
    $this->assertDatabaseMissing('appraisals', ['id' => $appraisal->id]);
});

test('users without review cycle update permission cannot delete cycles', function () {
    $user = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($user)->create();
    $cycle = ReviewCycle::factory()->create();

    $this->actingAs($user)
        ->delete(route('performance.review_cycles.destroy', $cycle))
        ->assertForbidden();

    $this->assertDatabaseHas('review_cycles', ['id' => $cycle->id]);
});

function reviewCycleDeleteAdmin(): User
{
    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.review_cycles.update', 'web');
    $user->givePermissionTo('performance.review_cycles.update');
    EmployeeProfile::factory()->for($user)->create();

    return $user;
}
