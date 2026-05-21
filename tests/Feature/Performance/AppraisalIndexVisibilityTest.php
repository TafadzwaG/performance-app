<?php

use App\Enums\AppraisalStatus;
use App\Models\Appraisal;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('employee only sees their own appraisals on the index', function () {
    $employee = User::factory()->create(['is_approved' => true]);
    $otherEmployee = User::factory()->create(['is_approved' => true]);
    grantAppraisalIndexPermissions($employee, ['performance.appraisals.view_own', 'performance.appraisals.self_assess']);

    $own = createIndexedAppraisal($employee, ['status' => AppraisalStatus::SelfAssessmentPending]);
    createIndexedAppraisal($otherEmployee, ['status' => AppraisalStatus::SelfAssessmentPending]);

    $this->actingAs($employee)
        ->get(route('performance.appraisals.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('appraisals.data', 1)
            ->where('appraisals.data.0.id', $own->id));
});

test('line manager only sees direct reports that need manager action', function () {
    $manager = User::factory()->create(['is_approved' => true]);
    $employee = User::factory()->create(['is_approved' => true]);
    grantAppraisalIndexPermissions($manager, [
        'performance.appraisals.view_own',
        'performance.appraisals.manager_review',
        'performance.appraisals.plan_manage',
    ]);

    $profile = EmployeeProfile::factory()->create(['user_id' => $employee->id]);
    $cycle = ReviewCycle::factory()->create();

    $pendingReview = Appraisal::factory()->create([
        'review_cycle_id' => $cycle->id,
        'employee_profile_id' => $profile->id,
        'employee_user_id' => $employee->id,
        'employee_name_snapshot' => $employee->name,
        'line_manager_user_id' => $manager->id,
        'status' => AppraisalStatus::ManagerReviewPending,
        'self_assessment_submitted_at' => now(),
    ]);

    Appraisal::factory()->create([
        'review_cycle_id' => $cycle->id,
        'employee_profile_id' => $profile->id,
        'employee_user_id' => $employee->id,
        'employee_name_snapshot' => $employee->name,
        'line_manager_user_id' => $manager->id,
        'status' => AppraisalStatus::Finalized,
        'self_assessment_submitted_at' => now()->subDays(2),
        'manager_reviewed_at' => now()->subDay(),
        'finalized_at' => now(),
    ]);

    $this->actingAs($manager)
        ->get(route('performance.appraisals.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('appraisals.data', 1)
            ->where('appraisals.data.0.id', $pendingReview->id));
});

test('approving manager only sees appraisals awaiting their approval decision', function () {
    $approver = User::factory()->create(['is_approved' => true]);
    $employee = User::factory()->create(['is_approved' => true]);
    grantAppraisalIndexPermissions($approver, [
        'performance.appraisals.view_own',
        'performance.appraisals.approve',
    ]);

    $profile = EmployeeProfile::factory()->create(['user_id' => $employee->id]);
    $cycle = ReviewCycle::factory()->create();

    $awaitingApproval = Appraisal::factory()->create([
        'review_cycle_id' => $cycle->id,
        'employee_profile_id' => $profile->id,
        'employee_user_id' => $employee->id,
        'employee_name_snapshot' => $employee->name,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::ApprovalPending,
        'manager_reviewed_at' => now(),
    ]);

    Appraisal::factory()->create([
        'review_cycle_id' => $cycle->id,
        'employee_profile_id' => $profile->id,
        'employee_user_id' => $employee->id,
        'employee_name_snapshot' => $employee->name,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::CalibrationPending,
        'approved_at' => now(),
    ]);

    $this->actingAs($approver)
        ->get(route('performance.appraisals.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('appraisals.data', 1)
            ->where('appraisals.data.0.id', $awaitingApproval->id));
});

test('hr user with view all still sees every appraisal', function () {
    $hrUser = User::factory()->create(['is_approved' => true]);
    grantAppraisalIndexPermissions($hrUser, ['performance.appraisals.view_all']);

    createIndexedAppraisal(User::factory()->create(['is_approved' => true]));
    createIndexedAppraisal(User::factory()->create(['is_approved' => true]));

    $this->actingAs($hrUser)
        ->get(route('performance.appraisals.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('appraisals.data', 2));
});

test('employee can open a finalized appraisal overview', function () {
    $employee = User::factory()->create(['is_approved' => true]);
    grantAppraisalIndexPermissions($employee, [
        'performance.appraisals.view_own',
        'performance.appraisals.self_assess',
        'performance.development_plans.view',
    ]);

    $appraisal = createIndexedAppraisal($employee, [
        'status' => AppraisalStatus::Finalized,
        'finalized_at' => now(),
        'goal_submitted_at' => now()->subDays(10),
        'self_assessment_submitted_at' => now()->subDays(8),
        'manager_reviewed_at' => now()->subDays(6),
        'approved_at' => now()->subDays(4),
        'calibrated_at' => now()->subDays(2),
    ]);

    $this->actingAs($employee)
        ->get(route('performance.appraisals.show', $appraisal))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('performance/appraisals/Show'));

    $this->actingAs($employee)
        ->get(route('performance.appraisals.finalize', $appraisal))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('performance/appraisals/FinalizeAppraisal'));
});

function grantAppraisalIndexPermissions(User $user, array $permissions): void
{
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);
}

function createIndexedAppraisal(User $employee, array $overrides = []): Appraisal
{
    $profile = EmployeeProfile::factory()->create([
        'user_id' => $employee->id,
    ]);

    return Appraisal::factory()->create(array_merge([
        'review_cycle_id' => ReviewCycle::factory()->create()->id,
        'employee_profile_id' => $profile->id,
        'employee_user_id' => $employee->id,
        'employee_name_snapshot' => $employee->name,
        'line_manager_user_id' => $profile->line_manager_user_id,
        'approving_manager_user_id' => $profile->approving_manager_user_id,
        'status' => AppraisalStatus::GoalSetting,
    ], $overrides));
}
