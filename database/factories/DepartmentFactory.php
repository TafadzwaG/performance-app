<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    public function definition(): array
    {
        $name = fake()->unique()->company().' Department';

        return [
            'name' => $name,
            'code' => Str::upper(Str::slug(fake()->unique()->lexify('dept-???'), '-')),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
