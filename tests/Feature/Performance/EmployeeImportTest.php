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
        'user_email,employee_number,department_name,job_title_name',
        "preview.employee@example.com,EMP-PRE-001,{$department->name},{$jobTitle->name}",
        'preview.employee@example.com,EMP-PRE-002,Unknown Dept,Unknown Title',
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

    $department = Department::factory()->create(['name' => 'Operations']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Analyst']);

    $csv = implode("\n", [
        'user_email,employee_number,department_name,job_title_name,line_manager_email',
        "import.employee@example.com,EMP-UP-001,{$department->name},{$jobTitle->name},{$manager->email}",
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
        'user_email,employee_number,department_name,job_title_name',
        'mapped.employee@example.com,EMP-MAP-001,HR Dept Spreadsheet,HR Role Spreadsheet',
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

function grantEmployeeImportPermissions(User $user): void
{
    Permission::findOrCreate('performance.employees.create', 'web');
    $user->givePermissionTo('performance.employees.create');
}
