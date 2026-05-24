<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('users index can filter by role department and employee profile link', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($admin)->create();
    Permission::findOrCreate('access.users.view', 'web');
    $admin->givePermissionTo('access.users.view');

    $employeeRole = Role::findOrCreate('Employee', 'web');
    $managerRole = Role::findOrCreate('Manager', 'web');
    $department = Department::factory()->create(['name' => 'Finance']);

    $linkedEmployee = User::factory()->create(['name' => 'Linked Employee', 'is_approved' => true]);
    $linkedEmployee->assignRole($employeeRole);
    EmployeeProfile::factory()->for($linkedEmployee)->create(['department_id' => $department->id]);

    $unlinkedManager = User::factory()->create(['name' => 'Unlinked Manager', 'is_approved' => true]);
    $unlinkedManager->assignRole($managerRole);

    $this->actingAs($admin)
        ->get(route('access.users.index', ['role_id' => $employeeRole->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('access/users/Index')
            ->where('filters.role_id', $employeeRole->id)
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Linked Employee'));

    $this->actingAs($admin)
        ->get(route('access.users.index', [
            'department_id' => $department->id,
            'employee_link' => 'linked',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('access/users/Index')
            ->where('filters.department_id', $department->id)
            ->where('filters.employee_link', 'linked')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Linked Employee'));

    $this->actingAs($admin)
        ->get(route('access.users.index', ['employee_link' => 'unlinked']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('access/users/Index')
            ->where('filters.employee_link', 'unlinked')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Unlinked Manager'));
});

test('users index can filter by direct permission assignment', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($admin)->create();
    Permission::findOrCreate('access.users.view', 'web');
    Permission::findOrCreate('performance.reports.view', 'web');
    $adminRole = Role::findOrCreate('Admin', 'web');
    $adminRole->givePermissionTo('access.users.view');
    $admin->assignRole($adminRole);

    $withDirectPermission = User::factory()->create(['name' => 'Report Viewer', 'is_approved' => true]);
    $withDirectPermission->givePermissionTo('performance.reports.view');

    User::factory()->create(['name' => 'Plain User', 'is_approved' => true]);

    $this->actingAs($admin)
        ->get(route('access.users.index', ['has_direct_permissions' => 'yes']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('access/users/Index')
            ->where('filters.has_direct_permissions', 'yes')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Report Viewer'));
});
