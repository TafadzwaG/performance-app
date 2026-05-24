<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use OpenSpout\Reader\XLSX\Reader;

function createUserExportAdmin(): User
{
    $admin = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($admin)->create();
    Permission::findOrCreate('access.users.view', 'web');
    $admin->givePermissionTo('access.users.view');

    return $admin;
}

function readSpreadsheetRows($response): array
{
    $reader = new Reader;
    $reader->open($response->baseResponse->getFile()->getPathname());

    $rows = [];

    foreach ($reader->getSheetIterator() as $sheet) {
        foreach ($sheet->getRowIterator() as $row) {
            $rows[] = $row->toArray();
        }

        break;
    }

    $reader->close();

    return $rows;
}

test('authorized admin can export users to excel with selected columns and employee profile link', function () {
    $admin = createUserExportAdmin();

    $employeeRole = Role::findOrCreate('Employee', 'web');
    $department = Department::factory()->create(['name' => 'Operations']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Analyst']);

    $user = User::factory()->create([
        'name' => 'Tariro User',
        'email' => 'tariro.user@example.com',
        'is_approved' => true,
    ]);
    $user->assignRole($employeeRole);

    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'USR-EXPORT-001',
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
    ]);

    $response = $this->actingAs($admin)->get(route('access.users.export', [
        'format' => 'xlsx',
        'columns' => [
            'name',
            'email',
            'roles',
            'employee_number',
            'department',
            'job_title',
            'employee_profile_url',
        ],
    ]));

    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('it-user-access-list-');
    expect($response->headers->get('content-type'))->toContain('spreadsheetml.sheet');

    $rows = readSpreadsheetRows($response);

    $tableHeader = collect($rows)->first(fn (array $row) => ($row[0] ?? null) === 'Name');
    $dataRow = collect($rows)->first(fn (array $row) => ($row[0] ?? null) === 'Tariro User');

    expect($tableHeader)->toBe([
        'Name',
        'Email',
        'Roles',
        'Employee Number',
        'Department',
        'Job Title',
        'Employee Profile Link',
    ]);

    expect($dataRow)->toBe([
        'Tariro User',
        'tariro.user@example.com',
        'Employee',
        'USR-EXPORT-001',
        'Operations',
        'Analyst',
        route('performance.employees.show', $profile->id, absolute: true),
    ]);
});

test('authorized admin can export users to pdf with selected columns', function () {
    $admin = createUserExportAdmin();

    $employeeRole = Role::findOrCreate('Employee', 'web');
    $user = User::factory()->create([
        'name' => 'PDF Export User',
        'email' => 'pdf.user@example.com',
        'is_approved' => true,
    ]);
    $user->assignRole($employeeRole);

    $response = $this->actingAs($admin)->get(route('access.users.export', [
        'format' => 'pdf',
        'columns' => ['name', 'email', 'roles'],
    ]));

    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('it-user-access-list-');
    expect($response->headers->get('content-type'))->toBe('application/pdf');

    $contents = file_get_contents($response->baseResponse->getFile()->getPathname());
    expect($contents)->toStartWith('%PDF');
});

test('default export includes roles and direct permissions', function () {
    $admin = createUserExportAdmin();

    Permission::findOrCreate('performance.reports.view', 'web');
    $employeeRole = Role::findOrCreate('Employee', 'web');

    $user = User::factory()->create([
        'name' => 'Default Columns User',
        'is_approved' => true,
    ]);
    $user->assignRole($employeeRole);
    $user->givePermissionTo('performance.reports.view');

    $response = $this->actingAs($admin)->get(route('access.users.export'));

    $response->assertOk();

    $rows = readSpreadsheetRows($response);
    $tableHeader = collect($rows)->first(fn (array $row) => ($row[0] ?? null) === 'Name');
    $dataRow = collect($rows)->first(fn (array $row) => ($row[0] ?? null) === 'Default Columns User');

    expect($tableHeader)->toContain('Roles', 'Direct Permissions');
    expect($dataRow[array_search('Roles', $tableHeader, true)])->toBe('Employee');
    expect($dataRow[array_search('Direct Permissions', $tableHeader, true)])->toBe('performance.reports.view');
});

test('optional it and security columns render correct values in excel export', function () {
    $admin = createUserExportAdmin();

    $verifiedAt = now()->subDays(3);
    $passwordChangedAt = now()->subDay();

    $user = User::factory()->withEmailMfa()->create([
        'name' => 'Security Columns User',
        'email' => 'security.user@example.com',
        'is_approved' => true,
        'email_verified_at' => $verifiedAt,
        'force_password_change' => true,
        'password_changed_at' => $passwordChangedAt,
    ]);

    EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'SEC-001',
    ]);

    $response = $this->actingAs($admin)->get(route('access.users.export', [
        'columns' => [
            'name',
            'email_verified_at',
            'mfa_enabled',
            'force_password_change',
            'password_changed_at',
            'direct_permission_count',
            'employee_profile_url',
        ],
    ]));

    $response->assertOk();

    $rows = readSpreadsheetRows($response);
    $tableHeader = collect($rows)->first(fn (array $row) => ($row[0] ?? null) === 'Name');
    $dataRow = collect($rows)->first(fn (array $row) => ($row[0] ?? null) === 'Security Columns User');

    expect($dataRow[array_search('Email Verified At', $tableHeader, true)])->toBe($verifiedAt->format('d M Y H:i'));
    expect($dataRow[array_search('MFA Enabled', $tableHeader, true)])->toBe('Yes');
    expect($dataRow[array_search('Force Password Change', $tableHeader, true)])->toBe('Yes');
    expect($dataRow[array_search('Password Changed At', $tableHeader, true)])->toBe($passwordChangedAt->format('d M Y H:i'));
    expect($dataRow[array_search('Direct Permission Count', $tableHeader, true)])->toBe('0');
    expect($dataRow[array_search('Employee Profile Link', $tableHeader, true)])->toContain('/performance/employees/');
});

test('excel and pdf exports respect role department approval employee link direct permission search and sort filters', function () {
    $admin = createUserExportAdmin();

    $employeeRole = Role::findOrCreate('Employee', 'web');
    $managerRole = Role::findOrCreate('Manager', 'web');
    $department = Department::factory()->create(['name' => 'Finance']);
    Permission::findOrCreate('performance.reports.view', 'web');

    $matched = User::factory()->create([
        'name' => 'Alpha Finance Employee',
        'email' => 'alpha.finance@example.com',
        'is_approved' => true,
    ]);
    $matched->assignRole($employeeRole);
    $matched->givePermissionTo('performance.reports.view');
    EmployeeProfile::factory()->for($matched)->create(['department_id' => $department->id]);

    $otherDepartment = User::factory()->create([
        'name' => 'Beta Other Department',
        'is_approved' => true,
    ]);
    $otherDepartment->assignRole($employeeRole);
    EmployeeProfile::factory()->for($otherDepartment)->create();

    $unlinkedManager = User::factory()->create([
        'name' => 'Gamma Unlinked Manager',
        'is_approved' => true,
    ]);
    $unlinkedManager->assignRole($managerRole);

    $query = [
        'search' => 'Alpha',
        'approval_status' => 'active',
        'role_id' => $employeeRole->id,
        'department_id' => $department->id,
        'employee_link' => 'linked',
        'has_direct_permissions' => 'yes',
        'sort_by' => 'name',
        'sort_dir' => 'asc',
        'columns' => ['name', 'email', 'roles'],
    ];

    foreach (['xlsx', 'pdf'] as $format) {
        $response = $this->actingAs($admin)->get(route('access.users.export', [
            ...$query,
            'format' => $format,
        ]));

        $response->assertOk();

        if ($format === 'xlsx') {
            $rows = readSpreadsheetRows($response);
            $names = collect($rows)
                ->filter(fn (array $row) => ($row[0] ?? null) === 'Alpha Finance Employee' || ($row[0] ?? null) === 'Beta Other Department' || ($row[0] ?? null) === 'Gamma Unlinked Manager')
                ->pluck(0)
                ->all();

            expect($names)->toBe(['Alpha Finance Employee']);
        } else {
            expect($response->headers->get('content-type'))->toBe('application/pdf');
        }
    }
});

test('users without view permission cannot export users to excel or pdf', function () {
    $user = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('access.users.export', ['format' => 'xlsx']))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('access.users.export', ['format' => 'pdf']))
        ->assertForbidden();
});
