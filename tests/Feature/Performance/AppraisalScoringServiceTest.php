<?php

use App\Enums\RatingScaleType;
use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Models\AppraisalTemplate;
use App\Models\RatingScale;
use App\Models\RatingScaleLevel;
use App\Services\Performance\AppraisalScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('overall score uses business score only when values are not rated', function () {
    [$template, $objectiveLevel, $overallHigh] = scoringTemplate();

    $appraisal = Appraisal::factory()
        ->for($template, 'template')
        ->create([
            'business_weight_percent' => 80,
            'values_weight_percent' => 20,
        ]);

    AppraisalObjective::factory()
        ->for($appraisal)
        ->create([
            'weight' => 100,
            'manager_rating_scale_level_id' => $objectiveLevel->id,
            'manager_rating_score' => 4,
            'include_in_business_score' => true,
        ]);

    $result = app(AppraisalScoringService::class)->calculate($appraisal);

    expect($result['business_score'])->toBe(80.0)
        ->and($result['values_score'])->toBeNull()
        ->and($result['overall_score'])->toBe(80.0)
        ->and($result['overall_level']?->id)->toBe($overallHigh->id);
});

function scoringTemplate(): array
{
    $objectiveScale = RatingScale::factory()->create(['applies_to' => RatingScaleType::Objective]);
    $competencyScale = RatingScale::factory()->create(['applies_to' => RatingScaleType::Competency]);
    $overallScale = RatingScale::factory()->create(['applies_to' => RatingScaleType::Overall]);

    $objectiveLevel = RatingScaleLevel::create([
        'rating_scale_id' => $objectiveScale->id,
        'label' => 'Strong',
        'value' => 4,
        'sort_order' => 1,
    ]);

    RatingScaleLevel::create([
        'rating_scale_id' => $objectiveScale->id,
        'label' => 'Excellent',
        'value' => 5,
        'sort_order' => 2,
    ]);

    RatingScaleLevel::create([
        'rating_scale_id' => $competencyScale->id,
        'label' => 'Strong',
        'value' => 4,
        'sort_order' => 1,
    ]);

    RatingScaleLevel::create([
        'rating_scale_id' => $competencyScale->id,
        'label' => 'Excellent',
        'value' => 5,
        'sort_order' => 2,
    ]);

    $overallHigh = RatingScaleLevel::create([
        'rating_scale_id' => $overallScale->id,
        'label' => 'High',
        'value' => 4,
        'min_percent' => 75,
        'max_percent' => 100,
        'sort_order' => 1,
    ]);

    RatingScaleLevel::create([
        'rating_scale_id' => $overallScale->id,
        'label' => 'Developing',
        'value' => 2,
        'min_percent' => 0,
        'max_percent' => 74.99,
        'sort_order' => 2,
    ]);

    $template = AppraisalTemplate::factory()->create([
        'objective_rating_scale_id' => $objectiveScale->id,
        'competency_rating_scale_id' => $competencyScale->id,
        'overall_rating_scale_id' => $overallScale->id,
        'business_weight_percent' => 80,
        'values_weight_percent' => 20,
    ]);

    return [$template, $objectiveLevel, $overallHigh];
}
