<?php

namespace Database\Factories;

use App\Enums\AppraisalStatus;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppraisalFactory extends Factory
{
    protected $model = Appraisal::class;

    public function definition(): array
    {
        return [
            'review_cycle_id' => ReviewCycle::factory(),
            'employee_profile_id' => EmployeeProfile::factory(),
            'template_id' => AppraisalTemplate::factory(),
            'employee_user_id' => fn (array $attributes) => EmployeeProfile::query()->find($attributes['employee_profile_id'])?->user_id,
            'line_manager_user_id' => fn (array $attributes) => EmployeeProfile::query()->find($attributes['employee_profile_id'])?->line_manager_user_id,
            'approving_manager_user_id' => fn (array $attributes) => EmployeeProfile::query()->find($attributes['employee_profile_id'])?->approving_manager_user_id,
            'status' => AppraisalStatus::Draft,
            'business_weight_percent' => 80,
            'values_weight_percent' => 20,
            'employee_name_snapshot' => fn (array $attributes) => EmployeeProfile::query()->with('user')->find($attributes['employee_profile_id'])?->user?->name ?? fake()->name(),
            'employee_email_snapshot' => fn (array $attributes) => EmployeeProfile::query()->with('user')->find($attributes['employee_profile_id'])?->user?->email ?? fake()->unique()->safeEmail(),
            'employee_number_snapshot' => fn (array $attributes) => EmployeeProfile::query()->find($attributes['employee_profile_id'])?->employee_number ?? fake()->unique()->numerify('EMP###'),
            'department_name_snapshot' => fn (array $attributes) => EmployeeProfile::query()->with('department')->find($attributes['employee_profile_id'])?->department?->name,
            'job_title_name_snapshot' => fn (array $attributes) => EmployeeProfile::query()->with('jobTitle')->find($attributes['employee_profile_id'])?->jobTitle?->name,
            'cycle_name_snapshot' => fake()->year().' Performance Cycle',
            'template_name_snapshot' => fake()->words(3, true),
        ];
    }
}
