<?php

namespace Database\Factories;

use App\Models\JobTitle;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class JobTitleFactory extends Factory
{
    protected $model = JobTitle::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->jobTitle(),
            'code' => Str::upper(fake()->unique()->lexify('job-???')),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
