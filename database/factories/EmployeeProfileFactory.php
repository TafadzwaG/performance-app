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
            'department_id' => Department::factory(),
            'job_title_id' => JobTitle::factory(),
            'line_manager_user_id' => null,
            'approving_manager_user_id' => null,
            'employment_status' => EmploymentStatus::Active,
            'hire_date' => fake()->date(),
            'is_active' => true,
        ];
    }
}
