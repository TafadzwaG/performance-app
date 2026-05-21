<?php

namespace Database\Factories;

use App\Models\AppraisalTemplate;
use App\Models\RatingScale;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class AppraisalTemplateFactory extends Factory
{
    protected $model = AppraisalTemplate::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'code' => Str::lower(fake()->unique()->lexify('template-???')),
            'version' => 1,
            'description' => fake()->sentence(),
            'objective_rating_scale_id' => RatingScale::factory(),
            'competency_rating_scale_id' => RatingScale::factory(),
            'overall_rating_scale_id' => RatingScale::factory(),
            'business_weight_percent' => 80,
            'values_weight_percent' => 20,
            'min_objectives' => 4,
            'max_objectives' => 6,
            'allow_competencies' => true,
            'is_default' => false,
            'is_protected' => false,
            'is_active' => true,
        ];
    }
}
