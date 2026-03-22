<?php

namespace Database\Factories;

use App\Models\Perspective;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PerspectiveFactory extends Factory
{
    protected $model = Perspective::class;

    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name' => Str::title($name),
            'code' => Str::lower(Str::slug($name)),
            'description' => fake()->sentence(),
            'sort_order' => fake()->numberBetween(1, 10),
            'is_active' => true,
        ];
    }
}
