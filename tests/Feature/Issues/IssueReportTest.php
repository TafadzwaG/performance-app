<?php

use App\Enums\IssueStatus;
use App\Enums\IssueType;
use App\Models\EmployeeProfile;
use App\Models\IssueReport;
use App\Models\IssueStatusHistory;
use App\Models\Role;
use App\Models\User;
use App\Notifications\Issues\IssueAssignedNotification;
use App\Notifications\Issues\IssueReportedNotification;
use App\Notifications\Issues\IssueStatusChangedNotification;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
});

function issueEmployee(): User
{
    $user = User::factory()->create(['is_approved' => true]);
    $user->assignRole('Employee');
    EmployeeProfile::factory()->for($user)->create();

    return $user;
}

function issueAdmin(): User
{
    $user = User::factory()->create(['is_approved' => true]);
    $user->assignRole('HR Admin');
    EmployeeProfile::factory()->for($user)->create();

    return $user;
}

test('user can create an issue with type and description', function () {
    Notification::fake();

    $user = issueEmployee();

    $this->actingAs($user)
        ->post(route('issues.store'), [
            'type' => IssueType::Bug->value,
            'title' => 'Dashboard fails to load',
            'description' => 'The dashboard shows a blank screen after login.',
        ])
        ->assertRedirect();

    $issue = IssueReport::query()->first();

    expect($issue)->not->toBeNull()
        ->and($issue->status)->toBe(IssueStatus::Pending)
        ->and($issue->reporter_user_id)->toBe($user->id)
        ->and($issue->type)->toBe(IssueType::Bug);

    Notification::assertSentTo($user, IssueReportedNotification::class);
});

test('reporter can view own issue but not another users issue', function () {
    $reporter = issueEmployee();
    $other = issueEmployee();

    $ownIssue = IssueReport::factory()->for($reporter, 'reporter')->create();
    $foreignIssue = IssueReport::factory()->for($other, 'reporter')->create();

    $this->actingAs($reporter)
        ->get(route('issues.show', $ownIssue))
        ->assertOk();

    $this->actingAs($reporter)
        ->get(route('issues.show', $foreignIssue))
        ->assertForbidden();
});

test('admin can view all issues and assign handler', function () {
    Notification::fake();

    $admin = issueAdmin();
    $reporter = issueEmployee();
    $handler = issueAdmin();

    $issue = IssueReport::factory()->for($reporter, 'reporter')->create();

    $this->actingAs($admin)
        ->get(route('issues.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('issues/Index'));

    $this->actingAs($admin)
        ->post(route('issues.assign', $issue), [
            'assignee_user_id' => $handler->id,
            'note' => 'Please investigate.',
        ])
        ->assertRedirect(route('issues.show', $issue));

    $issue->refresh();

    expect($issue->assignee_user_id)->toBe($handler->id)
        ->and($issue->status)->toBe(IssueStatus::InProgress);

    Notification::assertSentTo($reporter, IssueAssignedNotification::class);
    Notification::assertSentTo($handler, IssueAssignedNotification::class);
});

test('admin can complete issue with note and history is recorded', function () {
    Notification::fake();

    $admin = issueAdmin();
    $reporter = issueEmployee();
    $handler = issueAdmin();

    $issue = IssueReport::factory()
        ->for($reporter, 'reporter')
        ->assigned($handler)
        ->create();

    $this->actingAs($admin)
        ->post(route('issues.status', $issue), [
            'status' => IssueStatus::Completed->value,
            'note' => 'Resolved by clearing cache.',
        ])
        ->assertRedirect(route('issues.show', $issue));

    $issue->refresh();

    expect($issue->status)->toBe(IssueStatus::Completed);
    expect(IssueStatusHistory::query()->where('issue_report_id', $issue->id)->count())->toBeGreaterThan(0);

    Notification::assertSentTo($reporter, IssueStatusChangedNotification::class);
    Notification::assertSentTo($handler, IssueStatusChangedNotification::class);
});

test('duplicate notification is not sent when reporter is also assignee', function () {
    Notification::fake();

    $admin = issueAdmin();
    $soloUser = issueEmployee();

    $issue = IssueReport::factory()->for($soloUser, 'reporter')->create();

    $this->actingAs($admin)
        ->post(route('issues.assign', $issue), [
            'assignee_user_id' => $soloUser->id,
            'note' => 'Self assigned.',
        ])
        ->assertRedirect();

    Notification::assertSentToTimes($soloUser, IssueAssignedNotification::class, 1);
});

test('employee cannot assign or update issue status', function () {
    $employee = issueEmployee();
    $other = issueEmployee();
    $issue = IssueReport::factory()->for($employee, 'reporter')->create();

    $this->actingAs($employee)
        ->post(route('issues.assign', $issue), [
            'assignee_user_id' => $other->id,
        ])
        ->assertForbidden();

    $this->actingAs($employee)
        ->post(route('issues.status', $issue), [
            'status' => IssueStatus::InProgress->value,
        ])
        ->assertForbidden();
});

test('reporter can update own pending issue details', function () {
    $employee = issueEmployee();

    $issue = IssueReport::factory()->for($employee, 'reporter')->create([
        'type' => IssueType::Bug,
        'title' => 'Original title',
        'description' => 'Original description.',
    ]);

    $this->actingAs($employee)
        ->get(route('issues.show', $issue))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('issues/Show')
            ->where('can.update', true)
            ->has('typeOptions', 6));

    $this->actingAs($employee)
        ->put(route('issues.update', $issue), [
            'type' => IssueType::FeatureRequest->value,
            'title' => 'Updated title',
            'description' => 'Updated description with more detail.',
        ])
        ->assertRedirect(route('issues.show', $issue));

    $issue->refresh();

    expect($issue->type)->toBe(IssueType::FeatureRequest)
        ->and($issue->title)->toBe('Updated title')
        ->and($issue->description)->toBe('Updated description with more detail.');
});

test('reporter cannot update completed issue details', function () {
    $employee = issueEmployee();

    $issue = IssueReport::factory()
        ->for($employee, 'reporter')
        ->create(['status' => IssueStatus::Completed]);

    $this->actingAs($employee)
        ->put(route('issues.update', $issue), [
            'type' => IssueType::Bug->value,
            'title' => 'Should not save',
            'description' => 'Should not save.',
        ])
        ->assertForbidden();
});

test('admin can update issue details', function () {
    $admin = issueAdmin();
    $reporter = issueEmployee();

    $issue = IssueReport::factory()->for($reporter, 'reporter')->create();

    $this->actingAs($admin)
        ->put(route('issues.update', $issue), [
            'type' => IssueType::DataProblem->value,
            'title' => 'Admin edited title',
            'description' => 'Admin edited description.',
        ])
        ->assertRedirect(route('issues.show', $issue));

    $issue->refresh();

    expect($issue->title)->toBe('Admin edited title');
});

test('completing an issue requires a completion note', function () {
    $admin = issueAdmin();
    $issue = IssueReport::factory()->create();

    $this->actingAs($admin)
        ->from(route('issues.show', $issue))
        ->post(route('issues.status', $issue), [
            'status' => IssueStatus::Completed->value,
        ])
        ->assertRedirect(route('issues.show', $issue))
        ->assertSessionHasErrors('note');
});

test('issues index includes filters and create form includes fixed issue types', function () {
    $admin = issueAdmin();

    $this->actingAs($admin)
        ->get(route('issues.index', ['search' => 'login', 'status' => IssueStatus::Pending->value]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('issues/Index')
            ->where('filters.search', 'login')
            ->where('filters.status', IssueStatus::Pending->value)
            ->has('typeOptions', 6));

    $this->actingAs(issueEmployee())
        ->get(route('issues.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('issues/Create')
            ->has('typeOptions', 6));
});

test('employee role includes issue permissions in shared auth props', function () {
    $employee = issueEmployee();
    $employee->load('permissions');

    expect($employee->can('issues.create'))->toBeTrue()
        ->and($employee->can('issues.view_own'))->toBeTrue()
        ->and($employee->can('issues.assign'))->toBeFalse();
});

test('employee shared auth exposes canReportIssue for report bubble', function () {
    $employee = issueEmployee();

    $this->actingAs($employee)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.canReportIssue', true));
});

test('super admin can access issues even when role permissions are stale', function () {
    $superAdminRole = Role::findOrCreate('Super Admin', 'web');
    $superAdminRole->syncPermissions([]);

    $superAdmin = User::factory()->create(['is_approved' => true]);
    $superAdmin->assignRole($superAdminRole);
    EmployeeProfile::factory()->for($superAdmin)->create();

    $this->actingAs($superAdmin)
        ->get(route('issues.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('issues/Index'));
});

test('app layout includes report issue bubble modal', function () {
    $layout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));
    $bubble = file_get_contents(resource_path('js/components/issues/report-issue-bubble.tsx'));

    expect($layout)->toContain('ReportIssueBubble')
        ->and($bubble)->toContain('Report an issue')
        ->and($bubble)->toContain("route('issues.store')")
        ->and($bubble)->toContain('sm:max-w-5xl')
        ->and($bubble)->toContain('onEscapeKeyDown')
        ->and($bubble)->toContain('onInteractOutside')
        ->and($bubble)->toContain("role.toLowerCase() === 'super admin'");
});
