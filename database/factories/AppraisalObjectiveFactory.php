<?php

namespace Database\Factories;

use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Models\Perspective;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppraisalObjectiveFactory extends Factory
{
    protected $model = AppraisalObjective::class;

    public function definition(): array
    {
        return [
            'appraisal_id' => Appraisal::factory(),
            'perspective_id' => Perspective::factory(),
            'objective_type' => 'business',
            'title' => fake()->sentence(4),
            'kpi_measure' => fake()->sentence(3),
            'target_definition' => fake()->sentence(6),
            'weight' => 25,
            'evidence_source' => fake()->sentence(3),
            'include_in_business_score' => true,
            'sort_order' => 0,
        ];
    }
}
