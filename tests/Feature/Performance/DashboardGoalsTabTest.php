<?php

use App\Enums\AppraisalStatus;
use App\Enums\RatingScaleType;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\RatingScale;
use App\Models\RatingScaleLevel;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('dashboard includes current-cycle goal view data for signed-in user only', function () {
    $user = User::factory()->create([
        'name' => 'T. Ndlovu',
        'is_approved' => true,
    ]);
    $user->givePermissionTo(Permission::findOrCreate('performance.dashboard.view', 'web'));

    $otherUser = User::factory()->create(['is_approved' => true]);
    $department = Department::factory()->create(['name' => 'Front Office']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Front Office Manager']);
    $perspective = Perspective::factory()->create(['name' => 'Financial']);

    $profile = EmployeeProfile::factory()
        ->for($user)
        ->for($department)
        ->for($jobTitle)
        ->create(['employee_number' => 'EMP-1001']);

    $otherProfile = EmployeeProfile::factory()
        ->for($otherUser)
        ->for($department)
        ->for($jobTitle)
        ->create();

    $cycle = ReviewCycle::factory()->create([
        'name' => '2026 Review',
        'code' => '2026',
        'status' => ReviewCycleStatus::Open,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
    ]);

    $objectiveScale = RatingScale::factory()->create([
        'name' => 'Business Objectives',
        'applies_to' => RatingScaleType::Objective,
    ]);
    $ratingLevel = RatingScaleLevel::create([
        'rating_scale_id' => $objectiveScale->id,
        'label' => 'Good performance',
        'short_label' => '3',
        'value' => 3,
        'min_percent' => 80,
        'max_percent' => 90,
        'sort_order' => 3,
    ]);

    $appraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::GoalSetting,
            'employee_name_snapshot' => 'T. Ndlovu',
            'employee_number_snapshot' => 'EMP-1001',
            'department_name_snapshot' => 'Front Office',
            'job_title_name_snapshot' => 'Front Office Manager',
            'cycle_name_snapshot' => '2026 Review',
        ]);

    AppraisalObjective::factory()->for($appraisal)->for($perspective)->create([
        'title' => 'Maximize room revenue',
        'kpi_measure' => 'Average Daily Rate',
        'target_definition' => 'Achieve ADR of 150',
        'weight' => 20,
        'evidence_source' => 'PMS Report',
        'performance_achieved' => 'ADR reached 152',
        'self_rating_scale_level_id' => $ratingLevel->id,
        'manager_rating_scale_level_id' => $ratingLevel->id,
        'sort_order' => 1,
    ]);

    $otherAppraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($otherProfile, 'employeeProfile')
        ->create([
            'employee_user_id' => $otherUser->id,
            'status' => AppraisalStatus::GoalSetting,
        ]);

    AppraisalObjective::factory()->for($otherAppraisal)->for($perspective)->create([
        'title' => 'Other employee goal',
        'sort_order' => 1,
    ]);

    $this->actingAs($user)
        ->get(route('performance.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/dashboard/Index')
            ->where('currentGoals.employee.name', 'T. Ndlovu')
            ->where('currentGoals.employee.job_title', 'Front Office Manager')
            ->where('currentGoals.review_period', '01 Jan 2026 - 31 Dec 2026')
            ->where('currentGoals.objectives.0.title', 'Maximize room revenue')
            ->where('currentGoals.objectives.0.self_rating', 'Good performance')
            ->missing('currentGoals.objectives.1'));
});

test('dashboard goal view is empty when user has no current open appraisal', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo(Permission::findOrCreate('performance.dashboard.view', 'web'));
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('performance.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/dashboard/Index')
            ->where('currentGoals', null)
            ->has('assignedGoalCycles', 0)
            ->has('goalsLookupEndpoint'));
});

test('dashboard includes assigned review cycles including completed cycles', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo(Permission::findOrCreate('performance.dashboard.view', 'web'));

    $profile = EmployeeProfile::factory()->for($user)->create();

    $openCycle = ReviewCycle::factory()->create([
        'name' => '2026 Review',
        'status' => ReviewCycleStatus::Open,
    ]);

    $closedCycle = ReviewCycle::factory()->create([
        'name' => '2025 Review',
        'status' => ReviewCycleStatus::Closed,
    ]);

    Appraisal::factory()
        ->for($openCycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::GoalSetting,
            'cycle_name_snapshot' => '2026 Review',
        ]);

    $completedAppraisal = Appraisal::factory()
        ->for($closedCycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::Finalized,
            'cycle_name_snapshot' => '2025 Review',
            'finalized_at' => now()->subYear(),
        ]);

    $this->actingAs($user)
        ->get(route('performance.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/dashboard/Index')
            ->has('assignedGoalCycles', 2)
            ->where('assignedGoalCycles.0.cycle_name', '2026 Review')
            ->where('assignedGoalCycles.0.is_current', true)
            ->where('assignedGoalCycles.0.is_completed', false)
            ->where('assignedGoalCycles.1.cycle_name', '2025 Review')
            ->where('assignedGoalCycles.1.is_completed', true));
});

test('dashboard goals lookup returns signed-in user review cycles', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo(Permission::findOrCreate('performance.dashboard.view', 'web'));

    $profile = EmployeeProfile::factory()->for($user)->create();

    $openCycle = ReviewCycle::factory()->create([
        'name' => '2026 Review',
        'code' => '2026',
        'status' => ReviewCycleStatus::Open,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
    ]);

    $closedCycle = ReviewCycle::factory()->create([
        'name' => '2025 Review',
        'code' => '2025',
        'status' => ReviewCycleStatus::Closed,
        'start_date' => '2025-01-01',
        'end_date' => '2025-12-31',
    ]);

    $currentAppraisal = Appraisal::factory()
        ->for($openCycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::GoalSetting,
            'cycle_name_snapshot' => '2026 Review',
        ]);

    $historicalAppraisal = Appraisal::factory()
        ->for($closedCycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::Finalized,
            'cycle_name_snapshot' => '2025 Review',
            'finalized_at' => now()->subYear(),
        ]);

    AppraisalObjective::factory()->for($historicalAppraisal)->create([
        'title' => 'Improve guest satisfaction',
        'sort_order' => 1,
    ]);

    $this->actingAs($user)
        ->getJson(route('performance.dashboard.goals.lookup', ['q' => '2025']))
        ->assertOk()
        ->assertJsonPath('results.0.value', $historicalAppraisal->id)
        ->assertJsonPath('results.0.cycle_name', '2025 Review')
        ->assertJsonPath('results.0.is_completed', true);

    $this->actingAs($user)
        ->getJson(route('performance.dashboard.goals.show', $historicalAppraisal))
        ->assertOk()
        ->assertJsonPath('appraisal_id', $historicalAppraisal->id)
        ->assertJsonPath('objectives.0.title', 'Improve guest satisfaction')
        ->assertJsonPath('is_current', false);

    $otherUser = User::factory()->create(['is_approved' => true]);
    $otherUser->givePermissionTo(Permission::findOrCreate('performance.dashboard.view', 'web'));
    EmployeeProfile::factory()->for($otherUser)->create();

    $this->actingAs($otherUser)
        ->getJson(route('performance.dashboard.goals.show', $historicalAppraisal))
        ->assertForbidden();

    expect($currentAppraisal->id)->not->toBe($historicalAppraisal->id);
});

test('dashboard includes score summary for finalized appraisal', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo(Permission::findOrCreate('performance.dashboard.view', 'web'));

    $profile = EmployeeProfile::factory()->for($user)->create();

    $cycle = ReviewCycle::factory()->create([
        'name' => '2025 Review',
        'status' => ReviewCycleStatus::Closed,
    ]);

    $appraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::Finalized,
            'business_score' => 82,
            'values_score' => 78,
            'overall_score' => 80,
            'finalized_at' => now()->subDay(),
            'cycle_name_snapshot' => '2025 Review',
        ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/dashboard/Index')
            ->where('myScoreSummary.business_score', 82)
            ->where('myScoreSummary.values_score', 78)
            ->where('myScoreSummary.overall_score', 80)
            ->where('myScoreSummary.cycle_name', '2025 Review')
            ->has('assignedGoalCycles', 1));

    $this->actingAs($user)
        ->getJson(route('performance.dashboard.goals.show', $appraisal))
        ->assertOk()
        ->assertJsonPath('score_summary.overall_score', 80)
        ->assertJsonPath('score_summary.business_score', 82);
});
