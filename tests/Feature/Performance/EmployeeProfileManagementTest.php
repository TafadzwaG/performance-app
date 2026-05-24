<?php

use App\Enums\AppraisalStatus;
use App\Enums\EmploymentStatus;
use App\Enums\RatingScaleType;
use App\Models\Appraisal;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\RatingScale;
use App\Models\RatingScaleLevel;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use OpenSpout\Reader\XLSX\Reader;

uses(RefreshDatabase::class);

test('employee create, index, show, and edit routes are accessible to authorized users', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantPermissions($admin, [
        'performance.employees.view',
        'performance.employees.create',
        'performance.employees.update',
    ]);

    $profile = EmployeeProfile::factory()->create();

    $this->actingAs($admin)
        ->get(route('performance.employees.index'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('performance.employees.create'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('performance.employees.show', $profile))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('performance.employees.edit', $profile))
        ->assertOk();
});

test('employee profile can be created with expanded hr and performance fields', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantPermissions($admin, [
        'performance.employees.create',
        'performance.employees.assign_roles',
    ]);

    $role = Role::findOrCreate('Employee', 'web');
    $subjectUser = User::factory()->create();
    $manager = User::factory()->create();
    $approver = User::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();

    $response = $this->actingAs($admin)->post(route('performance.employees.store'), [
        'user_id' => $subjectUser->id,
        'employee_number' => 'EMP1001',
        'national_id' => 'ID-1001',
        'date_of_birth' => '1994-03-12',
        'gender' => 'female',
        'marital_status' => 'married',
        'personal_phone' => '+27710000001',
        'home_address_line_1' => '12 Example Street',
        'home_address_line_2' => 'Unit 4',
        'city' => 'Johannesburg',
        'state_province' => 'Gauteng',
        'postal_code' => '2000',
        'country' => 'South Africa',
        'emergency_contact_name' => 'Jane Contact',
        'emergency_contact_phone' => '+27719999999',
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'employment_status' => EmploymentStatus::Active->value,
        'employment_type' => 'permanent',
        'work_location' => 'Head Office',
        'hire_date' => '2024-01-01',
        'probation_end_date' => '2024-06-30',
        'confirmation_date' => '2024-07-01',
        'is_review_eligible' => true,
        'review_eligibility_date' => '2024-07-01',
        'notes' => 'Ready for the upcoming review cycle.',
        'is_active' => true,
        'role_ids' => [$role->id],
    ]);

    $profile = EmployeeProfile::query()->where('employee_number', 'EMP1001')->firstOrFail();

    $response->assertRedirect(route('performance.employees.show', $profile));

    $this->assertDatabaseHas('employee_profiles', [
        'id' => $profile->id,
        'user_id' => $subjectUser->id,
        'national_id' => 'ID-1001',
        'city' => 'Johannesburg',
        'employment_type' => 'permanent',
        'work_location' => 'Head Office',
        'is_review_eligible' => true,
    ]);

    expect($subjectUser->fresh()->hasRole($role))->toBeTrue();
});

test('employee profile update validates national id uniqueness and manager relationships', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantPermissions($admin, [
        'performance.employees.update',
    ]);

    $profileA = EmployeeProfile::factory()->create([
        'national_id' => 'ID-UNIQUE-1',
    ]);
    $profileB = EmployeeProfile::factory()->create([
        'national_id' => 'ID-UNIQUE-2',
    ]);

    $this->actingAs($admin)
        ->from(route('performance.employees.edit', $profileB))
        ->put(route('performance.employees.update', $profileB), [
            'user_id' => $profileB->user_id,
            'employee_number' => $profileB->employee_number,
            'national_id' => $profileA->national_id,
            'date_of_birth' => '1990-01-01',
            'gender' => 'male',
            'marital_status' => 'single',
            'personal_phone' => '+27700000000',
            'home_address_line_1' => '1 Sample Street',
            'home_address_line_2' => '',
            'city' => 'Cape Town',
            'state_province' => 'Western Cape',
            'postal_code' => '8000',
            'country' => 'South Africa',
            'emergency_contact_name' => 'Example Person',
            'emergency_contact_phone' => '+27700000001',
            'department_id' => $profileB->department_id,
            'job_title_id' => $profileB->job_title_id,
            'line_manager_user_id' => $profileB->user_id,
            'approving_manager_user_id' => $profileB->approving_manager_user_id,
            'employment_status' => EmploymentStatus::Active->value,
            'employment_type' => 'permanent',
            'work_location' => 'Remote',
            'hire_date' => '2024-01-01',
            'probation_end_date' => '2024-06-01',
            'confirmation_date' => '2024-06-15',
            'is_review_eligible' => true,
            'review_eligibility_date' => '2024-07-01',
            'notes' => 'Validation check',
            'is_active' => true,
            'role_ids' => [],
        ])
        ->assertRedirect(route('performance.employees.edit', $profileB))
        ->assertSessionHasErrors(['national_id', 'line_manager_user_id']);
});

test('employee profile can be updated with expanded fields', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantPermissions($admin, [
        'performance.employees.update',
        'performance.employees.assign_roles',
    ]);

    $role = Role::findOrCreate('Manager', 'web');
    $profile = EmployeeProfile::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $manager = User::factory()->create();
    $approver = User::factory()->create();

    $response = $this->actingAs($admin)->put(route('performance.employees.update', $profile), [
        'user_id' => $profile->user_id,
        'employee_number' => 'EMP2002',
        'national_id' => 'ID-2002',
        'date_of_birth' => '1991-07-21',
        'gender' => 'other',
        'marital_status' => 'single',
        'personal_phone' => '+27821234567',
        'home_address_line_1' => '34 Updated Ave',
        'home_address_line_2' => '',
        'city' => 'Durban',
        'state_province' => 'KwaZulu-Natal',
        'postal_code' => '4001',
        'country' => 'South Africa',
        'emergency_contact_name' => 'Updated Contact',
        'emergency_contact_phone' => '+27827654321',
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'employment_status' => EmploymentStatus::Probation->value,
        'employment_type' => 'contract',
        'work_location' => 'Regional Office',
        'hire_date' => '2025-01-01',
        'probation_end_date' => '2025-03-31',
        'confirmation_date' => '2025-04-01',
        'is_review_eligible' => false,
        'review_eligibility_date' => '2025-07-01',
        'notes' => 'Updated via feature test.',
        'is_active' => false,
        'role_ids' => [$role->id],
    ]);

    $response->assertRedirect(route('performance.employees.show', $profile));

    $this->assertDatabaseHas('employee_profiles', [
        'id' => $profile->id,
        'employee_number' => 'EMP2002',
        'national_id' => 'ID-2002',
        'city' => 'Durban',
        'employment_status' => EmploymentStatus::Probation->value,
        'employment_type' => 'contract',
        'is_review_eligible' => false,
        'is_active' => false,
    ]);

    expect($profile->user->fresh()->hasRole($role))->toBeTrue();
});

test('department detail includes department employees with latest appraisal outcome', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantPermissions($admin, [
        'performance.setup.departments.view',
    ]);

    $department = Department::factory()->create(['name' => 'Operations']);
    $otherDepartment = Department::factory()->create(['name' => 'Finance']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Operations Analyst']);
    $employeeUser = User::factory()->create(['name' => 'Tariro Employee']);
    $otherUser = User::factory()->create(['name' => 'Other Employee']);

    $profile = EmployeeProfile::factory()
        ->for($employeeUser, 'user')
        ->for($department)
        ->for($jobTitle, 'jobTitle')
        ->create([
            'employee_number' => 'EMP-D-001',
            'employment_status' => EmploymentStatus::Active,
            'work_location' => 'Harare',
            'is_review_eligible' => true,
        ]);

    EmployeeProfile::factory()
        ->for($otherUser, 'user')
        ->for($otherDepartment)
        ->create(['employee_number' => 'EMP-D-999']);

    $ratingScale = RatingScale::factory()->create(['applies_to' => RatingScaleType::Overall]);
    $originalRating = RatingScaleLevel::create([
        'rating_scale_id' => $ratingScale->id,
        'label' => 'Exceeds',
        'value' => 4,
        'sort_order' => 1,
    ]);
    $calibratedRating = RatingScaleLevel::create([
        'rating_scale_id' => $ratingScale->id,
        'label' => 'Meets',
        'value' => 3,
        'sort_order' => 2,
    ]);

    Appraisal::factory()
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $employeeUser->id,
            'status' => AppraisalStatus::Finalized,
            'cycle_name_snapshot' => '2026 Annual Review',
            'overall_score' => 91,
            'calibrated_overall_score' => 77,
            'overall_rating_scale_level_id' => $originalRating->id,
            'calibrated_overall_rating_scale_level_id' => $calibratedRating->id,
            'finalized_at' => now(),
            'updated_at' => now(),
        ]);

    $this->actingAs($admin)
        ->get(route('performance.setup.departments.show', $department))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/setup/departments/Show')
            ->has('department.employee_profiles', 1)
            ->where('department.employee_profiles.0.employee_number', 'EMP-D-001')
            ->where('department.employee_profiles.0.user.name', 'Tariro Employee')
            ->where('department.employee_profiles.0.job_title.name', 'Operations Analyst')
            ->where('department.employee_profiles.0.latest_appraisal.cycle_name_snapshot', '2026 Annual Review')
            ->where('department.employee_profiles.0.latest_appraisal.calibrated_overall_score', '77.00')
            ->where('department.employee_profiles.0.latest_appraisal.calibrated_overall_rating_level.label', 'Meets')
        );
});

test('employee index provides export column choices from the backend', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantPermissions($admin, [
        'performance.employees.view',
    ]);

    $this->actingAs($admin)
        ->get(route('performance.employees.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/employees/Index')
            ->has('exportColumns')
            ->where('exportColumns.0.key', 'user_name')
            ->where('exportColumns.0.label', 'Employee Name')
            ->where('exportColumns.0.default', true)
            ->where('exportColumns.0.section', 'identity')
            ->where('exportColumns.0.required', true)
        );
});

test('employees export downloads selected columns with effective latest appraisal values', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    grantPermissions($admin, [
        'performance.employees.view',
    ]);

    $department = Department::factory()->create(['name' => 'Operations']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Operations Analyst']);
    $employeeUser = User::factory()->create(['name' => 'Tariro Employee', 'email' => 'tariro@example.com']);

    $profile = EmployeeProfile::factory()
        ->for($employeeUser, 'user')
        ->for($department)
        ->for($jobTitle, 'jobTitle')
        ->create([
            'employee_number' => 'EMP-EXPORT-001',
            'employment_status' => EmploymentStatus::Active,
            'is_active' => true,
            'is_review_eligible' => true,
        ]);

    $ratingScale = RatingScale::factory()->create(['applies_to' => RatingScaleType::Overall]);
    $originalRating = RatingScaleLevel::create([
        'rating_scale_id' => $ratingScale->id,
        'label' => 'Exceeds',
        'value' => 4,
        'sort_order' => 1,
    ]);
    $calibratedRating = RatingScaleLevel::create([
        'rating_scale_id' => $ratingScale->id,
        'label' => 'Meets',
        'value' => 3,
        'sort_order' => 2,
    ]);

    Appraisal::factory()
        ->for($profile, 'employeeProfile')
        ->create([
            'employee_user_id' => $employeeUser->id,
            'status' => AppraisalStatus::Finalized,
            'cycle_name_snapshot' => '2026 Annual Review',
            'overall_score' => 91,
            'calibrated_overall_score' => 77,
            'overall_rating_scale_level_id' => $originalRating->id,
            'calibrated_overall_rating_scale_level_id' => $calibratedRating->id,
            'finalized_at' => now(),
            'updated_at' => now(),
        ]);

    $response = $this->actingAs($admin)->get(route('performance.employees.export', [
        'columns' => [
            'user_name',
            'employee_number',
            'department_id',
            'latest_overall_score',
            'latest_overall_rating',
        ],
    ]));

    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('employees-');

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

    expect($rows)->toBe([
        ['Employee Name', 'Employee Number', 'Department', 'Recent Score', 'Recent Rating'],
        ['Tariro Employee', 'EMP-EXPORT-001', 'Operations', '77.00', 'Meets'],
    ]);
});

test('authenticated users can view and update their own employee profile', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $profile = EmployeeProfile::factory()->for($user)->create([
        'city' => 'Cape Town',
        'personal_phone' => '+27110000000',
    ]);

    $this->actingAs($user)
        ->get(route('performance.profile.show'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/employees/Show')
            ->where('isOwnProfile', true)
            ->where('employeeProfile.id', $profile->id));

    $this->actingAs($user)
        ->get(route('performance.profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/employees/Edit')
            ->where('isOwnProfile', true));

    $this->actingAs($user)
        ->put(route('performance.profile.update'), [
            'national_id' => $profile->national_id,
            'date_of_birth' => $profile->date_of_birth?->format('Y-m-d'),
            'gender' => $profile->gender,
            'marital_status' => $profile->marital_status,
            'personal_phone' => '+27112223333',
            'home_address_line_1' => $profile->home_address_line_1,
            'home_address_line_2' => $profile->home_address_line_2,
            'city' => 'Johannesburg',
            'state_province' => $profile->state_province,
            'postal_code' => $profile->postal_code,
            'country' => $profile->country,
            'emergency_contact_name' => $profile->emergency_contact_name ?? 'Jane Contact',
            'emergency_contact_phone' => '+27719998888',
            'notes' => $profile->notes,
        ])
        ->assertRedirect(route('performance.profile.show'));

    expect($profile->fresh())
        ->city->toBe('Johannesburg')
        ->personal_phone->toBe('+27112223333');
});

test('authorized user can preview employee deletion impact', function () {
    $admin = createEmployeeAdmin('Confirm@Password1');
    $targetUser = User::factory()->create(['is_approved' => true]);
    $profile = EmployeeProfile::factory()->for($targetUser)->create();
    Appraisal::factory()->for($profile, 'employeeProfile')->for($targetUser, 'employee')->create();

    $response = $this->actingAs($admin)
        ->getJson(route('performance.employees.deletion_impact', $profile))
        ->assertOk()
        ->assertJsonPath('employee.id', $profile->id);

    $appraisalItem = collect($response->json('items'))->firstWhere('key', 'appraisals');

    expect($appraisalItem['count'] ?? 0)->toBe(1);
});

test('authorized user can delete an employee with password confirmation', function () {
    $admin = createEmployeeAdmin('Confirm@Password1');
    $targetUser = User::factory()->create(['is_approved' => true, 'email' => 'delete-employee@example.test']);
    $profile = EmployeeProfile::factory()->for($targetUser)->create();

    $this->actingAs($admin)
        ->delete(route('performance.employees.destroy', $profile), [
            'current_password' => 'Confirm@Password1',
        ])
        ->assertRedirect(route('performance.employees.index'));

    expect(User::query()->whereKey($targetUser->id)->exists())->toBeFalse();
    expect(EmployeeProfile::withTrashed()->whereKey($profile->id)->exists())->toBeFalse();
});

test('employee deletion requires the actor current password', function () {
    $admin = createEmployeeAdmin('Confirm@Password1');
    $targetUser = User::factory()->create(['is_approved' => true]);
    $profile = EmployeeProfile::factory()->for($targetUser)->create();

    $this->actingAs($admin)
        ->from(route('performance.employees.index'))
        ->delete(route('performance.employees.destroy', $profile), [
            'current_password' => 'wrong-password',
        ])
        ->assertRedirect(route('performance.employees.index'))
        ->assertSessionHasErrors('current_password');

    expect(User::query()->whereKey($targetUser->id)->exists())->toBeTrue();
});

test('users cannot delete their own employee profile', function () {
    $admin = createEmployeeAdmin('Confirm@Password1');
    $profile = EmployeeProfile::query()->where('user_id', $admin->id)->firstOrFail();

    $this->actingAs($admin)
        ->delete(route('performance.employees.destroy', $profile), [
            'current_password' => 'Confirm@Password1',
        ])
        ->assertForbidden();

    expect(User::query()->whereKey($admin->id)->exists())->toBeTrue();
});

function createEmployeeAdmin(string $password = 'password'): User
{
    $user = User::factory()->create([
        'is_approved' => true,
        'password' => Hash::make($password),
    ]);

    EmployeeProfile::factory()->for($user)->create();

    grantPermissions($user, [
        'performance.employees.view',
        'performance.employees.update',
    ]);

    return $user;
}

function grantPermissions(User $user, array $permissions): void
{
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);
}
