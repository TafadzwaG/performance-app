<?php

use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('creating an appraisal redirects to the appraisals index', function () {
    $user = appraisalAssignmentAdmin();
    $cycle = ReviewCycle::factory()->create();
    $template = AppraisalTemplate::factory()->create();
    $approver = User::factory()->create(['is_approved' => true]);
    $profile = EmployeeProfile::factory()
        ->for(User::factory()->create(['is_approved' => true]))
        ->create([
            'approving_manager_user_id' => $approver->id,
            'line_manager_user_id' => $approver->id,
        ]);

    $this->actingAs($user)
        ->post(route('performance.appraisals.store'), [
            'review_cycle_id' => $cycle->id,
            'employee_profile_id' => $profile->id,
            'template_id' => $template->id,
        ])
        ->assertRedirect(route('performance.appraisals.index'))
        ->assertSessionHas('success');

    expect(Appraisal::query()->where('employee_profile_id', $profile->id)->exists())->toBeTrue();
});

test('authorized users can delete an appraisal from the index', function () {
    $user = appraisalAssignmentAdmin();
    $cycle = ReviewCycle::factory()->create(['name' => '2026 Annual Review']);
    $template = AppraisalTemplate::factory()->create();
    $profile = EmployeeProfile::factory()->for(User::factory()->create(['is_approved' => true]))->create();

    $appraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->for($template, 'template')
        ->create([
            'employee_name_snapshot' => 'Tariro Employee',
            'cycle_name_snapshot' => '2026 Annual Review',
        ]);

    $this->actingAs($user)
        ->delete(route('performance.appraisals.destroy', $appraisal))
        ->assertRedirect(route('performance.appraisals.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('appraisals', ['id' => $appraisal->id]);
});

test('users without assignment permission cannot delete appraisals', function () {
    $user = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($user)->create();

    $appraisal = Appraisal::factory()->create();

    $this->actingAs($user)
        ->delete(route('performance.appraisals.destroy', $appraisal))
        ->assertForbidden();

    $this->assertDatabaseHas('appraisals', ['id' => $appraisal->id]);
});

function appraisalAssignmentAdmin(): User
{
    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.review_cycles.assign_employees', 'web');
    $user->givePermissionTo('performance.review_cycles.assign_employees');
    EmployeeProfile::factory()->for($user)->create();

    return $user;
}
