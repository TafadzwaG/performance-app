<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('user without employee profile is redirected to complete profile after login and when opening dashboard', function () {
    $user = User::factory()->create([
        'password' => Hash::make('Welcome@1234'),
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'Welcome@1234',
    ])->assertRedirect(route('employee-profile.complete'));

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('employee-profile.complete'));
});

test('user can complete their employee profile and then reach the dashboard', function () {
    $user = User::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $manager = User::factory()->create();
    $approver = User::factory()->create();

    $this->actingAs($user)
        ->get(route('employee-profile.complete'))
        ->assertOk();

    $this->actingAs($user)
        ->post(route('employee-profile.complete.store'), [
            'employee_number' => 'EMP-SELF-1001',
            'national_id' => '63-123456-A-12',
            'date_of_birth' => '1995-04-12',
            'gender' => 'female',
            'marital_status' => 'single',
            'personal_phone' => '0772000001',
            'home_address_line_1' => '12 Samora Machel Avenue',
            'home_address_line_2' => 'Flat 4',
            'city' => 'Harare',
            'state_province' => 'Harare',
            'postal_code' => '',
            'country' => 'Zimbabwe',
            'emergency_contact_name' => 'Nyasha Moyo',
            'emergency_contact_phone' => '0772000002',
            'department_id' => $department->id,
            'job_title_id' => $jobTitle->id,
            'line_manager_user_id' => $manager->id,
            'approving_manager_user_id' => $approver->id,
            'employment_status' => 'active',
            'employment_type' => 'permanent',
            'work_location' => 'Harare Head Office',
            'hire_date' => '2025-01-06',
            'probation_end_date' => '2025-04-06',
            'confirmation_date' => '2025-04-07',
            'is_review_eligible' => true,
            'review_eligibility_date' => '2025-07-01',
            'notes' => 'Completed during first sign-in.',
            'is_active' => true,
        ])
        ->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('employee_profiles', [
        'user_id' => $user->id,
        'employee_number' => 'EMP-SELF-1001',
        'city' => 'Harare',
        'country' => 'Zimbabwe',
    ]);

    $this->actingAs($user->fresh())
        ->get(route('dashboard'))
        ->assertOk();
});

test('user with an employee profile is not redirected away from the dashboard', function () {
    $user = User::factory()->create();
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});
