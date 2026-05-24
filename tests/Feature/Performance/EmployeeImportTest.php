<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('authorized users can download the employee upload template', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantEmployeeImportPermissions($admin);

    $this->actingAs($admin)
        ->get(route('performance.employees.upload.template'))
        ->assertOk()
        ->assertDownload();
});

test('upload preview shows department and job title matching step', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantEmployeeImportPermissions($admin);

    User::factory()->create([
        'email' => 'preview.employee@example.com',
        'is_approved' => true,
    ]);

    $department = Department::factory()->create(['name' => 'Operations']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Analyst']);

    $csv = implode("\n", [
        'employee_number,user_email,department_name,job_title_name',
        "EMP-PRE-001,preview.employee@example.com,{$department->name},{$jobTitle->name}",
        'EMP-PRE-002,preview.employee@example.com,Unknown Dept,Unknown Title',
    ]);

    $file = UploadedFile::fake()->createWithContent('employees.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.employees.upload.preview'), ['file' => $file])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/employees/UploadPreview')
            ->has('preview.departments', 2)
            ->has('preview.job_titles', 2)
            ->where('preview.row_count', 2));
});

test('authorized users can import employees after mapping departments and job titles', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantEmployeeImportPermissions($admin);

    $employeeUser = User::factory()->create([
        'email' => 'import.employee@example.com',
        'is_approved' => true,
    ]);
    $manager = User::factory()->create([
        'email' => 'import.manager@example.com',
        'is_approved' => true,
    ]);
    EmployeeProfile::factory()->for($manager)->create([
        'employee_number' => 'MGR-UP-001',
    ]);

    $department = Department::factory()->create(['name' => 'Operations']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Analyst']);

    $csv = implode("\n", [
        'employee_number,user_email,department_name,job_title_name,line_manager_employee_number',
        "EMP-UP-001,import.employee@example.com,{$department->name},{$jobTitle->name},MGR-UP-001",
    ]);

    $file = UploadedFile::fake()->createWithContent('employees.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.employees.upload.preview'), ['file' => $file])
        ->assertOk();

    $this->actingAs($admin)
        ->post(route('performance.employees.upload.store'), [
            'department_mappings' => [
                ['source' => $department->name, 'department_id' => $department->id],
            ],
            'job_title_mappings' => [
                ['source' => $jobTitle->name, 'job_title_id' => $jobTitle->id],
            ],
        ])
        ->assertRedirect(route('performance.employees.index'));

    $profile = EmployeeProfile::query()->where('employee_number', 'EMP-UP-001')->first();

    expect($profile)->not->toBeNull()
        ->and($profile->user_id)->toBe($employeeUser->id)
        ->and($profile->department_id)->toBe($department->id)
        ->and($profile->job_title_id)->toBe($jobTitle->id)
        ->and($profile->line_manager_user_id)->toBe($manager->id);
});

test('users can map unknown spreadsheet labels to existing setup records', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantEmployeeImportPermissions($admin);

    $employeeUser = User::factory()->create([
        'email' => 'mapped.employee@example.com',
        'is_approved' => true,
    ]);

    $department = Department::factory()->create(['name' => 'Human Resources']);
    $jobTitle = JobTitle::factory()->create(['name' => 'HR Officer']);

    $csv = implode("\n", [
        'employee_number,user_email,department_name,job_title_name',
        'EMP-MAP-001,mapped.employee@example.com,HR Dept Spreadsheet,HR Role Spreadsheet',
    ]);

    $file = UploadedFile::fake()->createWithContent('employees.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.employees.upload.preview'), ['file' => $file])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('preview.departments.0.matched_id', null)
            ->where('preview.job_titles.0.matched_id', null));

    $this->actingAs($admin)
        ->post(route('performance.employees.upload.store'), [
            'department_mappings' => [
                ['source' => 'HR Dept Spreadsheet', 'department_id' => $department->id],
            ],
            'job_title_mappings' => [
                ['source' => 'HR Role Spreadsheet', 'job_title_id' => $jobTitle->id],
            ],
        ])
        ->assertRedirect(route('performance.employees.index'));

    $profile = EmployeeProfile::query()->where('employee_number', 'EMP-MAP-001')->first();

    expect($profile)->not->toBeNull()
        ->and($profile->user_id)->toBe($employeeUser->id)
        ->and($profile->department_id)->toBe($department->id)
        ->and($profile->job_title_id)->toBe($jobTitle->id);
});

test('import rejects duplicate employee numbers already in the system', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantEmployeeImportPermissions($admin);

    $existingUser = User::factory()->create([
        'email' => 'existing.employee@example.com',
        'is_approved' => true,
    ]);
    EmployeeProfile::factory()->for($existingUser)->create([
        'employee_number' => 'EMP-DUP-001',
    ]);

    $newUser = User::factory()->create([
        'email' => 'new.employee@example.com',
        'is_approved' => true,
    ]);

    $department = Department::factory()->create(['name' => 'Operations']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Analyst']);

    $csv = implode("\n", [
        'employee_number,user_email,department_name,job_title_name',
        "EMP-DUP-001,{$newUser->email},{$department->name},{$jobTitle->name}",
    ]);

    $file = UploadedFile::fake()->createWithContent('employees.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.employees.upload.preview'), ['file' => $file])
        ->assertOk();

    $this->actingAs($admin)
        ->from(route('performance.employees.upload.preview'))
        ->post(route('performance.employees.upload.store'), [
            'department_mappings' => [
                ['source' => $department->name, 'department_id' => $department->id],
            ],
            'job_title_mappings' => [
                ['source' => $jobTitle->name, 'job_title_id' => $jobTitle->id],
            ],
        ])
        ->assertRedirect(route('performance.employees.upload.preview'))
        ->assertSessionHasErrors('file');
});

function grantEmployeeImportPermissions(User $user): void
{
    Permission::findOrCreate('performance.employees.create', 'web');
    $user->givePermissionTo('performance.employees.create');
    EmployeeProfile::factory()->for($user)->create();
}
