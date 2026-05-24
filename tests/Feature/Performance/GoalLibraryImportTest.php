<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('authorized users can download the goal library upload template', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryImportPermissions($admin);

    $this->actingAs($admin)
        ->get(route('performance.goal_library.upload.template'))
        ->assertOk()
        ->assertDownload();
});

test('upload preview accepts normalized goal library files', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryImportPermissions($admin);

    $perspective = Perspective::factory()->create(['name' => 'Financial']);
    $department = Department::factory()->create(['name' => 'Front Office']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Front Office Manager']);

    $csv = implode("\n", [
        'perspective,objective,kpi_measure,target_definition,weight,evidence_source,department_name,job_title_name,is_active',
        "{$perspective->name},Maximize room revenue,Average Daily Rate,Achieve ADR of 150,20,PMS Report,{$department->name},{$jobTitle->name},yes",
    ]);

    $file = UploadedFile::fake()->createWithContent('goals.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.goal_library.upload.preview'), ['file' => $file])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/goal-library/UploadPreview')
            ->where('preview.row_count', 1)
            ->where('preview.sample_rows.0.objective', 'Maximize room revenue')
            ->where('preview.perspectives.0.matched_id', $perspective->id)
            ->where('preview.departments.0.matched_id', $department->id)
            ->where('preview.job_titles.0.matched_id', $jobTitle->id));
});

test('upload preview accepts form-like assessment table files', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryImportPermissions($admin);

    $perspective = Perspective::factory()->create(['name' => 'Customer']);

    $csv = implode("\n", [
        'Employee Name,T. Ndlovu,Job Title,Front Office Manager',
        'Department,Front Office,Review Period,Jan 2026 - Dec 2026',
        'Perspective,Objective (The Goal),KPI / Performance Measure (How Measured),Target (Success Definition),Weight,Evidence Source,Achieved,Self Rating,Manager Rating',
        "{$perspective->name},Deliver exceptional arrival experience,Guest Satisfaction Score,Maintain 95% positive score,25,Feedback System,,,",
    ]);

    $file = UploadedFile::fake()->createWithContent('assessment.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.goal_library.upload.preview'), ['file' => $file])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/goal-library/UploadPreview')
            ->where('preview.row_count', 1)
            ->where('preview.sample_rows.0.objective', 'Deliver exceptional arrival experience')
            ->where('preview.perspectives.0.matched_id', $perspective->id)
            ->where('preview.departments.0.source', 'Front Office')
            ->where('preview.job_titles.0.source', 'Front Office Manager'));
});

test('unknown setup labels appear in mapping preview', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryImportPermissions($admin);

    $csv = implode("\n", [
        'perspective,objective,kpi_measure,target_definition,weight,evidence_source,department_name,job_title_name',
        'Spreadsheet Perspective,Improve check-in speed,Average check-in time,Under 3 minutes,20,PMS Data,Spreadsheet Department,Spreadsheet Role',
    ]);

    $file = UploadedFile::fake()->createWithContent('goals.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.goal_library.upload.preview'), ['file' => $file])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('preview.perspectives.0.source', 'Spreadsheet Perspective')
            ->where('preview.perspectives.0.matched_id', null)
            ->where('preview.departments.0.source', 'Spreadsheet Department')
            ->where('preview.departments.0.matched_id', null)
            ->where('preview.job_titles.0.source', 'Spreadsheet Role')
            ->where('preview.job_titles.0.matched_id', null));
});

test('authorized users can import goal library items after mapping setup labels', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryImportPermissions($admin);

    $perspective = Perspective::factory()->create(['name' => 'Financial']);
    $department = Department::factory()->create(['name' => 'Front Office']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Front Office Manager']);

    $csv = implode("\n", [
        'perspective,objective,kpi_measure,target_definition,weight,evidence_source,department_name,job_title_name,is_active',
        'Spreadsheet Perspective,Maximize room revenue,Average Daily Rate,Achieve ADR of 150,20,PMS Report,Spreadsheet Department,Spreadsheet Role,yes',
    ]);

    $file = UploadedFile::fake()->createWithContent('goals.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.goal_library.upload.preview'), ['file' => $file])
        ->assertOk();

    $this->actingAs($admin)
        ->post(route('performance.goal_library.upload.store'), [
            'perspective_mappings' => [
                ['source' => 'Spreadsheet Perspective', 'perspective_id' => $perspective->id],
            ],
            'department_mappings' => [
                ['source' => 'Spreadsheet Department', 'department_id' => $department->id],
            ],
            'job_title_mappings' => [
                ['source' => 'Spreadsheet Role', 'job_title_id' => $jobTitle->id],
            ],
        ])
        ->assertRedirect(route('performance.goal_library.index'));

    $goal = GoalLibraryItem::query()->where('title', 'Maximize room revenue')->first();

    expect($goal)->not->toBeNull()
        ->and($goal->perspective_id)->toBe($perspective->id)
        ->and($goal->department_id)->toBe($department->id)
        ->and($goal->job_title_id)->toBe($jobTitle->id)
        ->and((float) $goal->default_weight)->toBe(20.0)
        ->and($goal->is_active)->toBeTrue();
});

test('upload preview reports missing required goal data', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryImportPermissions($admin);

    $csv = implode("\n", [
        'perspective,objective,kpi_measure,target_definition',
        'Financial,,Average Daily Rate,Achieve ADR of 150',
    ]);

    $file = UploadedFile::fake()->createWithContent('goals.csv', $csv);

    $this->actingAs($admin)
        ->post(route('performance.goal_library.upload.preview'), ['file' => $file])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('preview.row_count', 0)
            ->where('preview.row_errors.0', 'Row 2 is missing objective.'));
});

test('users without goal library create permission cannot import goals', function () {
    $user = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('performance.goal_library.upload'))
        ->assertForbidden();
});

function grantGoalLibraryImportPermissions(User $user): void
{
    Permission::findOrCreate('performance.goal_library.view', 'web');
    Permission::findOrCreate('performance.goal_library.create', 'web');
    Permission::findOrCreate('performance.goal_library.update', 'web');

    $user->givePermissionTo([
        'performance.goal_library.view',
        'performance.goal_library.create',
        'performance.goal_library.update',
    ]);

    EmployeeProfile::factory()->for($user)->create();
}
