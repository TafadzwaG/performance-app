<?php

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createGoalSettingAppraisal(int $objectiveCount = 1): array
{
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo(Permission::findOrCreate('performance.appraisals.plan_own', 'web'));

    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $perspective = Perspective::factory()->create();

    $profile = EmployeeProfile::factory()
        ->for($user)
        ->for($department)
        ->for($jobTitle)
        ->create();

    $cycle = ReviewCycle::factory()->create([
        'status' => ReviewCycleStatus::Open,
    ]);

    $appraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::GoalSetting,
        ]);

    for ($index = 0; $index < $objectiveCount; $index++) {
        AppraisalObjective::factory()
            ->for($appraisal)
            ->for($perspective)
            ->create([
                'title' => "Objective {$index}",
                'weight' => round(100 / $objectiveCount, 2),
                'sort_order' => $index + 1,
            ]);
    }

    return [$user, $appraisal, $perspective];
}

test('goal plan can be submitted with a single objective', function () {
    [$user, $appraisal] = createGoalSettingAppraisal(1);

    $this->actingAs($user)
        ->post(route('performance.appraisals.plan.submit', $appraisal))
        ->assertRedirect(route('performance.appraisals.show', $appraisal));

    $appraisal->refresh();

    expect($appraisal->status)->toBe(AppraisalStatus::SelfAssessmentPending);
});

test('goal plan submit still requires weights to total one hundred percent', function () {
    [$user, $appraisal] = createGoalSettingAppraisal(2);

    $appraisal->objectives()->update(['weight' => 40]);

    $this->actingAs($user)
        ->post(route('performance.appraisals.plan.submit', $appraisal))
        ->assertSessionHasErrors('objectives');

    expect($appraisal->fresh()->status)->toBe(AppraisalStatus::GoalSetting);
});
