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

test('employees can view my kpis scoped to their department and job title', function () {
    $user = myKpisEmployeeUser();
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

    $this->actingAs($user)
        ->get(route('performance.my_kpis.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/my-kpis/Index')
            ->where('scope.locked', true)
            ->where('scope.department_id', $finance->id)
            ->where('scope.job_title_id', $analyst->id)
            ->has('goalLibraryItems.data', 1));

    $visibleIds = collect($this->get(route('performance.my_kpis.index'))->original->getData()['page']['props']['goalLibraryItems']['data'])
        ->pluck('id')
        ->all();

    expect($visibleIds)->toBe([$roleSpecific->id]);
});

test('hr admins can access my kpis page without employee scope locking', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $hrRole = Role::findOrCreate('HR Admin', 'web');
    $hrRole->syncPermissions([
        Permission::findOrCreate('performance.goal_library.view', 'web'),
        Permission::findOrCreate('performance.goal_library.update', 'web'),
    ]);
    $user->assignRole($hrRole);

    EmployeeProfile::factory()
        ->for($user)
        ->for(Department::factory()->create())
        ->for(JobTitle::factory()->create())
        ->create();

    $this->actingAs($user)
        ->get(route('performance.my_kpis.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/my-kpis/Index')
            ->where('scope.locked', false));
});

test('super admins can filter my kpis by department job title and perspective', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $superAdminRole = Role::findOrCreate('Super Admin', 'web');
    $superAdminRole->syncPermissions([
        Permission::findOrCreate('performance.goal_library.view', 'web'),
        Permission::findOrCreate('performance.dashboard.view', 'web'),
    ]);
    $user->assignRole($superAdminRole);

    EmployeeProfile::factory()
        ->for($user)
        ->for(Department::factory()->create())
        ->for(JobTitle::factory()->create())
        ->create();

    $finance = Department::factory()->create(['name' => 'Finance']);
    $operations = Department::factory()->create(['name' => 'Operations']);
    $analyst = JobTitle::factory()->create(['name' => 'Analyst']);
    $manager = JobTitle::factory()->create(['name' => 'Manager']);
    $financial = Perspective::factory()->create(['name' => 'Financial']);
    $customer = Perspective::factory()->create(['name' => 'Customer']);

    $matching = GoalLibraryItem::factory()
        ->for($finance)
        ->for($analyst)
        ->for($financial)
        ->create(['title' => 'Finance analyst KPI']);

    GoalLibraryItem::factory()
        ->for($finance)
        ->for($manager)
        ->for($financial)
        ->create(['title' => 'Finance manager KPI']);

    GoalLibraryItem::factory()
        ->for($operations)
        ->for($analyst)
        ->for($customer)
        ->create(['title' => 'Operations analyst KPI']);

    $this->actingAs($user)
        ->get(route('performance.my_kpis.index', [
            'department_id' => $finance->id,
            'job_title_id' => $analyst->id,
            'perspective_id' => $financial->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/my-kpis/Index')
            ->where('scope.locked', false)
            ->where('filters.department_id', (string) $finance->id)
            ->where('filters.job_title_id', (string) $analyst->id)
            ->where('filters.perspective_id', (string) $financial->id)
            ->has('departmentOptions')
            ->has('jobTitleOptions')
            ->has('goalLibraryItems.data', 1)
            ->where('goalLibraryItems.data.0.id', $matching->id));
});

test('employees with goal library management permissions can view my kpis', function () {
    $user = myKpisEmployeeUser([
        'performance.goal_library.view',
        'performance.goal_library.update',
        'performance.goal_library.archive',
    ]);

    $this->actingAs($user)
        ->get(route('performance.my_kpis.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/my-kpis/Index')
            ->where('scope.locked', true));
});

test('employees can open my kpis create form with profile department and job title selected', function () {
    $user = myKpisEmployeeUser();
    $user->load('employeeProfile.department', 'employeeProfile.jobTitle');

    $this->actingAs($user)
        ->get(route('performance.my_kpis.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/goal-library/Create')
            ->where('scope.locked', true)
            ->where('scope.department_id', $user->employeeProfile->department_id)
            ->where('scope.job_title_id', $user->employeeProfile->job_title_id)
            ->where('formAction', route('performance.my_kpis.store'))
            ->where('indexHref', route('performance.my_kpis.index')));
});

test('employees can add my kpis using their profile department and job title', function () {
    $user = myKpisEmployeeUser();
    $user->load('employeeProfile.department', 'employeeProfile.jobTitle');
    $perspective = Perspective::factory()->create(['name' => 'Financial']);

    $this->actingAs($user)
        ->post(route('performance.my_kpis.store'), [
            'department_id' => Department::factory()->create()->id,
            'job_title_id' => JobTitle::factory()->create()->id,
            'perspective_id' => $perspective->id,
            'title' => 'Improve reporting accuracy',
            'kpi_measure' => 'Error rate',
            'target_definition' => 'Below 2%',
            'default_weight' => 20,
            'is_active' => true,
        ])
        ->assertRedirect(route('performance.my_kpis.index'));

    $this->assertDatabaseHas('goal_library_items', [
        'title' => 'Improve reporting accuracy',
        'department_id' => $user->employeeProfile->department_id,
        'job_title_id' => $user->employeeProfile->job_title_id,
        'perspective_id' => $perspective->id,
    ]);
});

test('employees can open my kpis edit form with profile department and job title selected', function () {
    $user = myKpisEmployeeUser();
    $user->load('employeeProfile.department', 'employeeProfile.jobTitle');
    $goal = GoalLibraryItem::factory()
        ->for($user->employeeProfile->department)
        ->for($user->employeeProfile->jobTitle)
        ->for(Perspective::factory()->create())
        ->create(['title' => 'Existing KPI']);

    $this->actingAs($user)
        ->get(route('performance.my_kpis.edit', $goal))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/goal-library/Edit')
            ->where('scope.locked', true)
            ->where('scope.department_id', $user->employeeProfile->department_id)
            ->where('scope.job_title_id', $user->employeeProfile->job_title_id)
            ->where('formAction', route('performance.my_kpis.update', $goal))
            ->where('indexHref', route('performance.my_kpis.index')));
});

test('employees can update my kpis while preserving their profile department and job title', function () {
    $user = myKpisEmployeeUser();
    $user->load('employeeProfile.department', 'employeeProfile.jobTitle');
    $perspective = Perspective::factory()->create(['name' => 'Financial']);
    $goal = GoalLibraryItem::factory()
        ->for($user->employeeProfile->department)
        ->for($user->employeeProfile->jobTitle)
        ->for($perspective)
        ->create(['title' => 'Existing KPI']);

    $this->actingAs($user)
        ->put(route('performance.my_kpis.update', $goal), [
            'department_id' => Department::factory()->create()->id,
            'job_title_id' => JobTitle::factory()->create()->id,
            'perspective_id' => $perspective->id,
            'title' => 'Updated reporting accuracy',
            'kpi_measure' => 'Updated error rate',
            'target_definition' => 'Below 1%',
            'default_weight' => 30,
            'is_active' => true,
        ])
        ->assertRedirect(route('performance.my_kpis.index'));

    $this->assertDatabaseHas('goal_library_items', [
        'id' => $goal->id,
        'title' => 'Updated reporting accuracy',
        'department_id' => $user->employeeProfile->department_id,
        'job_title_id' => $user->employeeProfile->job_title_id,
        'kpi_measure' => 'Updated error rate',
    ]);
});

test('employees cannot edit my kpis outside their profile scope', function () {
    $user = myKpisEmployeeUser();
    $otherGoal = GoalLibraryItem::factory()
        ->for(Department::factory()->create(['name' => 'Operations']))
        ->for(JobTitle::factory()->create(['name' => 'Manager']))
        ->for(Perspective::factory()->create())
        ->create(['title' => 'Other KPI']);

    $this->actingAs($user)
        ->get(route('performance.my_kpis.edit', $otherGoal))
        ->assertForbidden();
});

test('goal forms use kpi naming conventions', function () {
    $forms = [
        file_get_contents(resource_path('js/pages/performance/goal-library/Create.tsx')),
        file_get_contents(resource_path('js/pages/performance/goal-library/Edit.tsx')),
    ];

    foreach ($forms as $form) {
        expect($form)
            ->toContain('Perspective')
            ->toContain('Objective (The Goal)')
            ->toContain('KPI / Measure (How Measured)')
            ->toContain('Target (Success Definition)')
            ->toContain('Weight')
            ->toContain('Evidence Source');
    }
});

test('my kpis index table uses kpi naming conventions', function () {
    $index = file_get_contents(resource_path('js/pages/performance/my-kpis/Index.tsx'));

    expect($index)
        ->toContain('Perspective')
        ->toContain('Department')
        ->toContain('Job Title')
        ->toContain('Objective (The Goal)')
        ->toContain('KPI / Measure (How Measured)')
        ->toContain('Target (Success Definition)')
        ->toContain('Weight')
        ->toContain('Evidence Source');
});

function myKpisEmployeeUser(array $permissions = ['performance.goal_library.view']): User
{
    $user = User::factory()->create(['is_approved' => true]);
    $employeeRole = Role::findOrCreate('Employee', 'web');
    $employeeRole->syncPermissions(
        collect($permissions)
            ->map(fn (string $permission) => Permission::findOrCreate($permission, 'web'))
            ->all(),
    );
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
