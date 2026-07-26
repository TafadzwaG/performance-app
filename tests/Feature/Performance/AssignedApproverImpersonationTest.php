<?php

use App\Enums\AppraisalStatus;
use App\Models\Appraisal;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('impersonated assigned approver can open only their appraisal approval step', function () {
    $impersonator = User::factory()->create(['is_approved' => true]);
    $assignedApprover = User::factory()->create(['is_approved' => true]);
    $otherApprover = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->create(['user_id' => $assignedApprover->id]);

    $employeeProfile = EmployeeProfile::factory()->create([
        'approving_manager_user_id' => $assignedApprover->id,
    ]);
    $assignedAppraisal = Appraisal::factory()->create([
        'employee_profile_id' => $employeeProfile->id,
        'employee_user_id' => $employeeProfile->user_id,
        'approving_manager_user_id' => $assignedApprover->id,
        'status' => AppraisalStatus::ApprovalPending,
        'manager_reviewed_at' => now(),
    ]);

    $otherEmployeeProfile = EmployeeProfile::factory()->create([
        'approving_manager_user_id' => $otherApprover->id,
    ]);
    $otherAppraisal = Appraisal::factory()->create([
        'employee_profile_id' => $otherEmployeeProfile->id,
        'employee_user_id' => $otherEmployeeProfile->user_id,
        'approving_manager_user_id' => $otherApprover->id,
        'status' => AppraisalStatus::ApprovalPending,
        'manager_reviewed_at' => now(),
    ]);

    Permission::findOrCreate('access.users.impersonate', 'web');
    $impersonator->givePermissionTo('access.users.impersonate');

    expect($assignedApprover->can('performance.appraisals.approve'))->toBeFalse();

    $this->actingAs($impersonator)
        ->post(route('access.users.impersonate.store', $assignedApprover))
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($assignedApprover);

    $this->get(route('performance.appraisals.show', $assignedAppraisal))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/appraisals/Show')
            ->where('abilities.approve', true)
            ->where('abilities.approveEdit', true));

    $this->get(route('performance.appraisals.approval', $assignedAppraisal))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/appraisals/Approval')
            ->where('abilities.approveEdit', true));

    $this->get(route('performance.appraisals.approval', $otherAppraisal))
        ->assertForbidden();
});
