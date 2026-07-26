<?php

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Events\Performance\AppraisalStatusChanged;
use App\Models\Appraisal;
use App\Models\AppraisalMilestoneReminder;
use App\Models\AppraisalObjective;
use App\Models\AppraisalTemplate;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\ReviewCycle;
use App\Models\SystemSetting;
use App\Models\User;
use App\Notifications\Performance\AppraisalAssignedNotification;
use App\Notifications\Performance\AppraisalStepCompletedNotification;
use App\Notifications\Performance\ApprovalRequestedNotification;
use App\Notifications\Performance\CycleMilestoneReminderNotification;
use App\Notifications\Performance\SelfAssessmentSubmittedNotification;
use App\Services\Performance\AppraisalWorkflowNotificationService;
use App\Services\Performance\CycleMilestoneReminderService;
use App\Services\Performance\ReviewCycleAssignmentService;
use App\Support\Notifications\PerformanceNotificationChannels;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function enablePerformanceMailNotifications(): void
{
    SystemSetting::current()->update([
        'mail_notifications_enabled' => true,
        'smtp_host' => 'smtp.example.com',
        'smtp_port' => 587,
        'smtp_username' => 'mailer@example.com',
        'smtp_password' => 'secret',
        'mail_from_address' => 'noreply@example.com',
        'mail_from_name' => 'Performance App',
    ]);
}

test('appraisal assigned notification includes mail when system mail is enabled', function () {
    enablePerformanceMailNotifications();

    $employee = User::factory()->create(['name' => 'Assigned Employee']);
    $appraisal = Appraisal::factory()->for($employee, 'employee')->create([
        'cycle_name_snapshot' => '2026 Annual Review',
    ]);

    $notification = new AppraisalAssignedNotification($appraisal);

    expect($notification->via($employee))->toBe(['database', 'mail'])
        ->and($notification->toMail($employee)->subject)
        ->toBe('Appraisal assigned — 2026 Annual Review');
});

test('appraisal assigned notification stays in app only when mail is disabled', function () {
    SystemSetting::current()->update([
        'mail_notifications_enabled' => false,
    ]);

    $employee = User::factory()->create();
    $appraisal = Appraisal::factory()->for($employee, 'employee')->create();

    $notification = new AppraisalAssignedNotification($appraisal);

    expect($notification->via($employee))->toBe(['database']);
});

test('assigning a new appraisal notifies the employee', function () {
    Notification::fake();

    $admin = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.review_cycles.assign_employees', 'web');
    $admin->givePermissionTo('performance.review_cycles.assign_employees');

    $employeeUser = User::factory()->create(['is_approved' => true]);
    $manager = User::factory()->create(['is_approved' => true]);
    $approver = User::factory()->create(['is_approved' => true]);
    $department = Department::factory()->create();
    $profile = EmployeeProfile::factory()
        ->for($employeeUser)
        ->for($department)
        ->create([
            'line_manager_user_id' => $manager->id,
            'approving_manager_user_id' => $approver->id,
        ]);

    $cycle = ReviewCycle::factory()->create(['status' => ReviewCycleStatus::Draft]);
    $template = AppraisalTemplate::factory()->create();

    app(ReviewCycleAssignmentService::class)->assign($cycle, [$profile], $template, $admin);

    Notification::assertSentTo($employeeUser, AppraisalAssignedNotification::class);
});

test('re-assigning an existing appraisal does not dispatch another assigned event', function () {
    Event::fake([AppraisalStatusChanged::class]);

    $admin = User::factory()->create(['is_approved' => true]);
    $employeeUser = User::factory()->create(['is_approved' => true]);
    $manager = User::factory()->create(['is_approved' => true]);
    $approver = User::factory()->create(['is_approved' => true]);
    $department = Department::factory()->create();
    $profile = EmployeeProfile::factory()
        ->for($employeeUser)
        ->for($department)
        ->create([
            'line_manager_user_id' => $manager->id,
            'approving_manager_user_id' => $approver->id,
        ]);

    $cycle = ReviewCycle::factory()->create(['status' => ReviewCycleStatus::Draft]);
    $template = AppraisalTemplate::factory()->create();
    $service = app(ReviewCycleAssignmentService::class);

    $service->assign($cycle, [$profile], $template, $admin);

    Event::assertDispatched(AppraisalStatusChanged::class, fn (AppraisalStatusChanged $event) => $event->event === 'assigned');

    $service->assign($cycle, [$profile], $template, $admin);

    Event::assertDispatchedTimes(AppraisalStatusChanged::class, 1);
    expect(Appraisal::count())->toBe(1);
});

test('cycle milestone reminder service sends reminders seven three and one days before deadlines', function () {
    Notification::fake();

    $today = now()->startOfDay();
    $employee = User::factory()->create(['is_approved' => true]);
    $manager = User::factory()->create(['is_approved' => true]);
    $approver = User::factory()->create(['is_approved' => true]);
    $department = Department::factory()->create();
    $cycle = ReviewCycle::factory()->create([
        'status' => ReviewCycleStatus::Open,
        'goal_setting_deadline' => $today->copy()->addDays(3),
        'self_assessment_deadline' => $today->copy()->addDays(7),
    ]);

    $goalProfile = EmployeeProfile::factory()
        ->for(User::factory()->create(['is_approved' => true]))
        ->for($department)
        ->create([
            'line_manager_user_id' => $manager->id,
            'approving_manager_user_id' => $approver->id,
        ]);
    $goalProfile->load('user');

    $selfProfile = EmployeeProfile::factory()
        ->for($employee)
        ->for($department)
        ->create([
            'line_manager_user_id' => $manager->id,
            'approving_manager_user_id' => $approver->id,
        ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for($goalProfile, 'employeeProfile')->create([
        'employee_user_id' => $goalProfile->user_id,
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::GoalSetting,
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for($selfProfile, 'employeeProfile')->create([
        'employee_user_id' => $employee->id,
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::SelfAssessmentPending,
    ]);

    $sent = app(CycleMilestoneReminderService::class)->sendDueReminders($today);

    expect($sent)->toBe(2);

    Notification::assertSentTo($goalProfile->user, CycleMilestoneReminderNotification::class, function (CycleMilestoneReminderNotification $notification) {
        return $notification->milestoneKey === 'goal_setting' && $notification->daysRemaining === 3;
    });

    Notification::assertSentTo($employee, CycleMilestoneReminderNotification::class, function (CycleMilestoneReminderNotification $notification) {
        return $notification->milestoneKey === 'self_assessment' && $notification->daysRemaining === 7;
    });

    expect(AppraisalMilestoneReminder::query()->count())->toBe(2);
});

test('cycle milestone reminders are not sent twice for the same lead time', function () {
    Notification::fake();

    $today = now()->startOfDay();
    $employee = User::factory()->create(['is_approved' => true]);
    $manager = User::factory()->create(['is_approved' => true]);
    $approver = User::factory()->create(['is_approved' => true]);
    $department = Department::factory()->create();
    $profile = EmployeeProfile::factory()
        ->for($employee)
        ->for($department)
        ->create([
            'line_manager_user_id' => $manager->id,
            'approving_manager_user_id' => $approver->id,
        ]);

    $cycle = ReviewCycle::factory()->create([
        'status' => ReviewCycleStatus::Open,
        'manager_review_deadline' => $today->copy()->addDays(1),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for($profile, 'employeeProfile')->create([
        'employee_user_id' => $employee->id,
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::ManagerReviewPending,
    ]);

    $service = app(CycleMilestoneReminderService::class);

    expect($service->sendDueReminders($today))->toBe(1);
    expect($service->sendDueReminders($today))->toBe(0);

    Notification::assertSentToTimes($manager, CycleMilestoneReminderNotification::class, 1);
});

test('performance mail channel helper reflects system settings', function () {
    expect(PerformanceNotificationChannels::mailEnabled())->toBeFalse();

    enablePerformanceMailNotifications();

    expect(PerformanceNotificationChannels::mailEnabled())->toBeTrue()
        ->and(PerformanceNotificationChannels::forAppraisalWorkflow())->toBe(['database', 'mail']);
});

test('workflow step notifications include mail when system mail is enabled', function () {
    enablePerformanceMailNotifications();

    $employee = User::factory()->create();
    $appraisal = Appraisal::factory()->for($employee, 'employee')->create([
        'cycle_name_snapshot' => '2026 Annual Review',
    ]);

    $notification = new SelfAssessmentSubmittedNotification($appraisal);

    expect($notification->via($employee))->toBe(['database', 'mail'])
        ->and($notification->toMail($employee)->subject)
        ->toBe('Self assessment submitted — 2026 Annual Review');
});

test('submitting goal plan notifies the employee', function () {
    Notification::fake();

    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo([
        Permission::findOrCreate('performance.appraisals.plan_own', 'web'),
        Permission::findOrCreate('performance.appraisals.view_own', 'web'),
    ]);

    $profile = EmployeeProfile::factory()->for($user)->create();
    $cycle = ReviewCycle::factory()->create(['status' => ReviewCycleStatus::Open]);
    $appraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $user->id,
            'status' => AppraisalStatus::GoalSetting,
        ]);

    AppraisalObjective::factory()->for($appraisal)->create([
        'weight' => 100,
        'sort_order' => 1,
    ]);

    $this->actingAs($user)
        ->post(route('performance.appraisals.plan.submit', $appraisal))
        ->assertRedirect();

    Notification::assertSentTo($user, AppraisalStepCompletedNotification::class);
    Notification::assertNotSentTo($user, SelfAssessmentSubmittedNotification::class);
});

test('submitting self assessment notifies employee and line manager', function () {
    Notification::fake();

    $employee = User::factory()->create(['is_approved' => true]);
    $manager = User::factory()->create(['is_approved' => true]);
    $approver = User::factory()->create(['is_approved' => true]);

    $profile = EmployeeProfile::factory()->for($employee)->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
    ]);

    $appraisal = Appraisal::factory()
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $employee->id,
            'line_manager_user_id' => $manager->id,
            'approving_manager_user_id' => $approver->id,
            'status' => AppraisalStatus::ManagerReviewPending,
            'goal_submitted_at' => now()->subDays(2),
            'self_assessment_submitted_at' => now(),
        ]);

    app(AppraisalWorkflowNotificationService::class)
        ->handle(new AppraisalStatusChanged($appraisal, $employee, 'self_submitted'));

    Notification::assertSentTo($employee, AppraisalStepCompletedNotification::class);
    Notification::assertSentTo($manager, SelfAssessmentSubmittedNotification::class);
});

test('submitting manager review notifies manager and approving manager', function () {
    Notification::fake();

    $employee = User::factory()->create(['is_approved' => true]);
    $manager = User::factory()->create(['is_approved' => true]);
    $approver = User::factory()->create(['is_approved' => true]);

    $profile = EmployeeProfile::factory()->for($employee)->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
    ]);

    $appraisal = Appraisal::factory()
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $employee->id,
            'line_manager_user_id' => $manager->id,
            'approving_manager_user_id' => $approver->id,
            'status' => AppraisalStatus::ApprovalPending,
            'self_assessment_submitted_at' => now()->subDay(),
            'manager_reviewed_at' => now(),
        ]);

    app(AppraisalWorkflowNotificationService::class)
        ->handle(new AppraisalStatusChanged($appraisal, $manager, 'approval_requested'));

    Notification::assertSentTo($manager, AppraisalStepCompletedNotification::class);
    Notification::assertSentTo($approver, ApprovalRequestedNotification::class);
});
