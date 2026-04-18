<?php

use App\Enums\EmploymentStatus;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

function grantPermissions(User $user, array $permissions): void
{
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);
}
