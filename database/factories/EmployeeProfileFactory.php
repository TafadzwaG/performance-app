<?php

namespace Database\Factories;

use App\Enums\EmploymentStatus;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeProfileFactory extends Factory
{
    protected $model = EmployeeProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'employee_number' => fake()->unique()->numerify('EMP###'),
            'national_id' => fake()->unique()->numerify('ID########'),
            'date_of_birth' => fake()->dateTimeBetween('-55 years', '-21 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'marital_status' => fake()->randomElement(['single', 'married', 'divorced']),
            'personal_phone' => fake()->phoneNumber(),
            'home_address_line_1' => fake()->streetAddress(),
            'home_address_line_2' => fake()->secondaryAddress(),
            'city' => fake()->city(),
            'state_province' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country' => fake()->country(),
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_phone' => fake()->phoneNumber(),
            'department_id' => Department::factory(),
            'job_title_id' => JobTitle::factory(),
            'line_manager_user_id' => null,
            'approving_manager_user_id' => null,
            'employment_status' => EmploymentStatus::Active,
            'employment_type' => fake()->randomElement(['permanent', 'contract', 'temporary']),
            'work_location' => fake()->city(),
            'hire_date' => fake()->date(),
            'probation_end_date' => fake()->dateTimeBetween('now', '+6 months')->format('Y-m-d'),
            'confirmation_date' => fake()->dateTimeBetween('+3 months', '+12 months')->format('Y-m-d'),
            'is_review_eligible' => true,
            'review_eligibility_date' => fake()->dateTimeBetween('now', '+12 months')->format('Y-m-d'),
            'notes' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
