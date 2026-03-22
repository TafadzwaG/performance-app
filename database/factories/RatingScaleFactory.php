<?php

namespace Database\Factories;

use App\Enums\RatingScaleType;
use App\Models\RatingScale;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RatingScaleFactory extends Factory
{
    protected $model = RatingScale::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'code' => Str::lower(fake()->unique()->lexify('scale-???')),
            'applies_to' => fake()->randomElement(RatingScaleType::cases()),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
