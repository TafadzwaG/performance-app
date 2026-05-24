<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('employees only see goal library items for their department and job title', function () {
    $user = employeeGoalLibraryUser();
    $user->load('employeeProfile.department', 'employeeProfile.jobTitle');

    $finance = $user->employeeProfile->department;
    $analyst = $user->employeeProfile->jobTitle;
    $manager = JobTitle::factory()->create(['name' => 'Manager']);
    $operations = Department::factory()->create(['name' => 'Operations']);
    $perspective = Perspective::factory()->create(['name' => 'Financial']);

    GoalLibraryItem::factory()
        ->for($finance)
        ->for($perspective)
        ->create([
            'job_title_id' => null,
            'title' => 'Finance department goal',
        ]);

    $roleSpecific = GoalLibraryItem::factory()
        ->for($finance)
        ->for($analyst)
        ->for($perspective)
        ->create(['title' => 'Finance analyst goal']);

    GoalLibraryItem::factory()
        ->for($finance)
        ->for($manager)
        ->for($perspective)
        ->create(['title' => 'Finance manager goal']);

    GoalLibraryItem::factory()
        ->for($operations)
        ->for($analyst)
        ->for($perspective)
        ->create(['title' => 'Operations analyst goal']);

    $response = $this->actingAs($user)
        ->get(route('performance.goal_library.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/goal-library/Index')
            ->where('scope.locked', true)
            ->where('scope.department_id', $finance->id)
            ->where('scope.job_title_id', $analyst->id)
            ->has('goalLibraryItems.data', 1));

    $visibleIds = collect($response->original->getData()['page']['props']['goalLibraryItems']['data'])
        ->pluck('id')
        ->all();

    expect($visibleIds)->toBe([$roleSpecific->id]);
});

test('employees do not see department-wide goals without a matching job title', function () {
    $user = employeeGoalLibraryUser();
    $user->load('employeeProfile.department', 'employeeProfile.jobTitle');

    $departmentWide = GoalLibraryItem::factory()
        ->for($user->employeeProfile->department)
        ->for(Perspective::factory()->create())
        ->create([
            'job_title_id' => null,
            'title' => 'Shared department goal',
        ]);

    $this->actingAs($user)
        ->get(route('performance.goal_library.show', $departmentWide))
        ->assertForbidden();
});

test('employees only see active goal library items like the appraisal plan lookup', function () {
    $user = employeeGoalLibraryUser();
    $user->load('employeeProfile.department', 'employeeProfile.jobTitle');

    $finance = $user->employeeProfile->department;
    $analyst = $user->employeeProfile->jobTitle;
    $perspective = Perspective::factory()->create(['name' => 'Financial']);

    $activeGoal = GoalLibraryItem::factory()
        ->for($finance)
        ->for($analyst)
        ->for($perspective)
        ->create([
            'title' => 'Active analyst goal',
            'is_active' => true,
        ]);

    GoalLibraryItem::factory()
        ->for($finance)
        ->for($analyst)
        ->for($perspective)
        ->create([
            'title' => 'Archived analyst goal',
            'is_active' => false,
        ]);

    $response = $this->actingAs($user)
        ->get(route('performance.goal_library.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('goalLibraryItems.data', 1));

    $visibleIds = collect($response->original->getData()['page']['props']['goalLibraryItems']['data'])
        ->pluck('id')
        ->all();

    expect($visibleIds)->toBe([$activeGoal->id]);
});

test('employees create goal library items using their profile department and job title', function () {
    $user = employeeGoalLibraryUser();
    $user->load('employeeProfile.department', 'employeeProfile.jobTitle');
    $perspective = Perspective::factory()->create(['name' => 'Financial']);

    $this->actingAs($user)
        ->post(route('performance.goal_library.store'), [
            'department_id' => Department::factory()->create()->id,
            'job_title_id' => JobTitle::factory()->create()->id,
            'perspective_id' => $perspective->id,
            'title' => 'Improve reporting accuracy',
            'kpi_measure' => 'Error rate',
            'target_definition' => 'Below 2%',
            'default_weight' => 20,
            'is_active' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('goal_library_items', [
        'title' => 'Improve reporting accuracy',
        'department_id' => $user->employeeProfile->department_id,
        'job_title_id' => $user->employeeProfile->job_title_id,
        'perspective_id' => $perspective->id,
    ]);
});

test('employees cannot view goal library items outside their scope', function () {
    $user = employeeGoalLibraryUser();
    $otherGoal = GoalLibraryItem::factory()->create(['title' => 'Other team goal']);

    $this->actingAs($user)
        ->get(route('performance.goal_library.show', $otherGoal))
        ->assertForbidden();
});

function employeeGoalLibraryUser(): User
{
    $user = User::factory()->create(['is_approved' => true]);
    $employeeRole = Role::findOrCreate('Employee', 'web');
    $employeeRole->syncPermissions([
        Permission::findOrCreate('performance.goal_library.view', 'web'),
        Permission::findOrCreate('performance.goal_library.create', 'web'),
    ]);
    $user->assignRole($employeeRole);

    $department = Department::factory()->create(['name' => 'Finance']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Analyst']);

    EmployeeProfile::factory()
        ->for($user)
        ->for($department)
        ->for($jobTitle)
        ->create();

    return $user;
}
