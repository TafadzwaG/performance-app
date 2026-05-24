<?php

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\AppraisalObjective;
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

function createGoalSettingAppraisal(int $objectiveCount = 1): array
{
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo([
        Permission::findOrCreate('performance.appraisals.plan_own', 'web'),
        Permission::findOrCreate('performance.appraisals.view_own', 'web'),
    ]);

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

test('goal plan update persists imported kpi objectives', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo([
        Permission::findOrCreate('performance.appraisals.plan_own', 'web'),
        Permission::findOrCreate('performance.appraisals.view_own', 'web'),
    ]);

    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
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

    $kpi = GoalLibraryItem::factory()
        ->for($department)
        ->for($jobTitle)
        ->for($perspective)
        ->create([
            'title' => 'Improve customer response time',
            'kpi_measure' => 'Average first-response time in hours',
            'target_definition' => 'Under 4 hours for 95% of tickets',
            'default_weight' => 100,
            'evidence_source' => 'Helpdesk SLA report',
        ]);

    $this->actingAs($user)
        ->put(route('performance.appraisals.plan.update', $appraisal), [
            'objectives' => [[
                'perspective_id' => $perspective->id,
                'goal_library_item_id' => $kpi->id,
                'objective_type' => 'business',
                'title' => $kpi->title,
                'kpi_measure' => $kpi->kpi_measure,
                'target_definition' => $kpi->target_definition,
                'weight' => 100,
                'evidence_source' => $kpi->evidence_source,
                'include_in_business_score' => true,
            ]],
        ])
        ->assertRedirect(route('performance.appraisals.plan', $appraisal));

    $objective = AppraisalObjective::query()->where('appraisal_id', $appraisal->id)->sole();

    expect($objective->goal_library_item_id)->toBe($kpi->id)
        ->and($objective->title)->toBe('Improve customer response time')
        ->and($objective->kpi_measure)->toBe('Average first-response time in hours')
        ->and($objective->target_definition)->toBe('Under 4 hours for 95% of tickets')
        ->and($objective->evidence_source)->toBe('Helpdesk SLA report')
        ->and($objective->include_in_business_score)->toBeTrue();
});
