<?php

namespace Database\Factories;

use App\Enums\ReviewCycleStatus;
use App\Models\ReviewCycle;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ReviewCycleFactory extends Factory
{
    protected $model = ReviewCycle::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-1 month', '+1 month');
        $end = (clone $start)->modify('+6 months');

        return [
            'name' => fake()->year().' Performance Cycle',
            'code' => Str::upper(fake()->unique()->lexify('cycle-???')),
            'description' => fake()->sentence(),
            'start_date' => $start,
            'end_date' => $end,
            'goal_setting_deadline' => (clone $start)->modify('+2 weeks'),
            'self_assessment_deadline' => (clone $start)->modify('+3 months'),
            'manager_review_deadline' => (clone $start)->modify('+4 months'),
            'approval_deadline' => (clone $start)->modify('+5 months'),
            'status' => ReviewCycleStatus::Draft,
        ];
    }
}
