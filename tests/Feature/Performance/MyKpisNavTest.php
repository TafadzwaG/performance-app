<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('employee dashboard shares showMyKpis nav flag', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $employeeRole = Role::findOrCreate('Employee', 'web');
    $employeeRole->syncPermissions([
        Permission::findOrCreate('performance.dashboard.view', 'web'),
        Permission::findOrCreate('performance.goal_library.view', 'web'),
    ]);
    $user->assignRole($employeeRole);

    EmployeeProfile::factory()
        ->for($user)
        ->for(Department::factory()->create())
        ->for(JobTitle::factory()->create())
        ->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('nav.showMyKpis', true)
            ->where('auth.roles.0', 'Employee'));
});

test('authenticated non employee dashboard shares showMyKpis nav flag', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $hrRole = Role::findOrCreate('HR Admin', 'web');
    $hrRole->syncPermissions([
        Permission::findOrCreate('performance.dashboard.view', 'web'),
    ]);
    $user->assignRole($hrRole);
    EmployeeProfile::factory()
        ->for($user)
        ->for(Department::factory()->create())
        ->for(JobTitle::factory()->create())
        ->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('nav.showMyKpis', true)
            ->where('auth.roles.0', 'HR Admin'));
});

test('employee sidebar prefers my kpis and hides reports', function () {
    $sidebar = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($sidebar)
        ->toContain('nav?.showMyKpis === true')
        ->toContain("...(can('performance.goal_library.view', 'performance.goal_library.create', 'performance.goal_library.update') &&")
        ->toContain('!isEmployeeRole')
        ->toContain("...(!isEmployeeRole && can('performance.reports.view', 'performance.reports.export', 'performance.reports.print')");
});

test('sidebar shows issues for super admin role', function () {
    $sidebar = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($sidebar)
        ->toContain("role.toLowerCase() === 'super admin'")
        ->toContain("isSuperAdminRole || can('issues.view_own', 'issues.view_all', 'issues.create')");
});
