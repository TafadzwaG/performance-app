<?php

namespace Database\Factories;

use App\Models\GoalLibraryItem;
use App\Models\Perspective;
use Illuminate\Database\Eloquent\Factories\Factory;

class GoalLibraryItemFactory extends Factory
{
    protected $model = GoalLibraryItem::class;

    public function definition(): array
    {
        return [
            'perspective_id' => Perspective::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'kpi_measure' => fake()->sentence(3),
            'target_definition' => fake()->sentence(6),
            'default_weight' => 25,
            'evidence_source' => fake()->sentence(3),
            'timeline_days' => 90,
            'is_active' => true,
        ];
    }
}
