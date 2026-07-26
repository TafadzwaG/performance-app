<?php

use App\Enums\AppraisalStatus;
use App\Models\Appraisal;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\User;
use App\Notifications\Performance\ApprovalRequestedNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

test('changing an approving manager reroutes open appraisals to the replacement manager', function () {
    Notification::fake();

    $oldApprover = User::factory()->create(['is_approved' => true]);
    $newApprover = User::factory()->create(['is_approved' => true]);
    $employeeProfile = EmployeeProfile::factory()->create([
        'approving_manager_user_id' => $oldApprover->id,
    ]);

    $openAppraisal = Appraisal::factory()->create([
        'employee_profile_id' => $employeeProfile->id,
        'employee_user_id' => $employeeProfile->user_id,
        'approving_manager_user_id' => $oldApprover->id,
        'status' => AppraisalStatus::ApprovalPending,
        'manager_reviewed_at' => now(),
    ]);
    $finalizedAppraisal = Appraisal::factory()->create([
        'employee_profile_id' => $employeeProfile->id,
        'employee_user_id' => $employeeProfile->user_id,
        'approving_manager_user_id' => $oldApprover->id,
        'status' => AppraisalStatus::Finalized,
        'manager_reviewed_at' => now()->subDays(2),
        'approved_at' => now()->subDay(),
        'finalized_at' => now(),
    ]);

    foreach ([$oldApprover, $newApprover] as $approver) {
        Permission::findOrCreate('performance.appraisals.approve', 'web');
        $approver->givePermissionTo('performance.appraisals.approve');

        Cache::put(
            "performance:dashboard:organization:{$openAppraisal->organization_id}:user:{$approver->id}",
            ['stale' => true],
            300,
        );
    }

    $employeeProfile->update([
        'approving_manager_user_id' => $newApprover->id,
    ]);

    expect($openAppraisal->fresh()->approving_manager_user_id)->toBe($newApprover->id)
        ->and($finalizedAppraisal->fresh()->approving_manager_user_id)->toBe($oldApprover->id)
        ->and(Cache::has("performance:dashboard:organization:{$openAppraisal->organization_id}:user:{$oldApprover->id}"))->toBeFalse()
        ->and(Cache::has("performance:dashboard:organization:{$openAppraisal->organization_id}:user:{$newApprover->id}"))->toBeFalse()
        ->and($newApprover->can('approve', $openAppraisal->fresh()))->toBeTrue()
        ->and($oldApprover->can('approve', $openAppraisal->fresh()))->toBeFalse();

    Notification::assertSentTo($newApprover, ApprovalRequestedNotification::class);

    $this->actingAs($newApprover)
        ->get(route('performance.appraisals.approval', $openAppraisal))
        ->assertOk();

    $this->actingAs($oldApprover)
        ->get(route('performance.appraisals.approval', $openAppraisal))
        ->assertForbidden();
});
