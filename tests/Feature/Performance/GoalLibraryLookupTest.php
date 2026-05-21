<?php

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('goal library lookup returns goals for employee department and job title', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo(Permission::findOrCreate('performance.appraisals.plan_own', 'web'));

    $department = Department::factory()->create(['name' => 'Finance']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Analyst']);
    $otherJobTitle = JobTitle::factory()->create(['name' => 'Manager']);
    $perspective = Perspective::factory()->create();

    $profile = EmployeeProfile::factory()
        ->for($user)
        ->for($department)
        ->for($jobTitle)
        ->create();

    $cycle = ReviewCycle::factory()->create(['status' => ReviewCycleStatus::Open]);

    $appraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::GoalSetting,
        ]);

    $departmentWide = GoalLibraryItem::factory()
        ->for($department)
        ->for($perspective)
        ->create([
            'job_title_id' => null,
            'title' => 'Department revenue goal',
        ]);

    $roleSpecific = GoalLibraryItem::factory()
        ->for($department)
        ->for($jobTitle)
        ->for($perspective)
        ->create(['title' => 'Analyst accuracy goal']);

    GoalLibraryItem::factory()
        ->for($department)
        ->for($otherJobTitle)
        ->for($perspective)
        ->create(['title' => 'Manager coaching goal']);

    GoalLibraryItem::factory()
        ->for(Perspective::factory()->create())
        ->create(['title' => 'Other department goal', 'department_id' => Department::factory()->create()->id]);

    $this->actingAs($user)
        ->getJson(route('performance.appraisals.plan.goal_library', $appraisal))
        ->assertOk()
        ->assertJsonCount(2, 'results')
        ->assertJsonFragment(['label' => 'Department revenue goal'])
        ->assertJsonFragment(['label' => 'Analyst accuracy goal'])
        ->assertJsonMissing(['label' => 'Manager coaching goal'])
        ->assertJsonMissing(['label' => 'Other department goal']);

    $this->actingAs($user)
        ->getJson(route('performance.appraisals.plan.goal_library', ['appraisal' => $appraisal, 'q' => 'Analyst']))
        ->assertOk()
        ->assertJsonCount(1, 'results')
        ->assertJsonFragment(['label' => 'Analyst accuracy goal'])
        ->assertJsonPath('results.0.perspective_id', $perspective->id)
        ->assertJsonPath('results.0.default_weight', 25);
});
