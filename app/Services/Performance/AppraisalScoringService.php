<?php

namespace App\Services\Performance;

use App\Models\Appraisal;
use App\Models\RatingScaleLevel;

class AppraisalScoringService
{
    public function calculate(Appraisal $appraisal): array
    {
        $appraisal->loadMissing([
            'template.objectiveRatingScale.levels',
            'template.competencyRatingScale.levels',
            'template.overallRatingScale.levels',
            'objectives.managerRatingLevel',
            'competencyRatings.managerRatingLevel',
        ]);

        $objectiveMax = (float) ($appraisal->template->objectiveRatingScale->levels->max('value') ?: 1);
        $competencyMax = (float) ($appraisal->template->competencyRatingScale->levels->max('value') ?: 1);

        $businessScore = round($appraisal->objectives
            ->where('include_in_business_score', true)
            ->sum(function ($objective) use ($objectiveMax) {
                if (! $objective->manager_rating_score) {
                    return 0;
                }

                $normalized = ((float) $objective->manager_rating_score / $objectiveMax) * 100;

                return $normalized * (((float) $objective->weight) / 100);
            }), 2);

        $competencyRatings = $appraisal->competencyRatings->filter(fn ($rating) => ! is_null($rating->manager_rating_score));
        $valuesScore = round($competencyRatings->isNotEmpty()
            ? $competencyRatings->avg(fn ($rating) => ((float) $rating->manager_rating_score / $competencyMax) * 100)
            : 0, 2);

        $overallScore = round(
            (($businessScore * (float) $appraisal->business_weight_percent) + ($valuesScore * (float) $appraisal->values_weight_percent)) / 100,
            2
        );

        $overallLevel = $this->mapOverallLevel($appraisal, $overallScore);

        return [
            'business_score' => $businessScore,
            'values_score' => $valuesScore,
            'overall_score' => $overallScore,
            'overall_level' => $overallLevel,
        ];
    }

    public function refresh(Appraisal $appraisal): Appraisal
    {
        $result = $this->calculate($appraisal);

        $appraisal->forceFill([
            'business_score' => $result['business_score'],
            'values_score' => $result['values_score'],
            'overall_score' => $result['overall_score'],
            'overall_rating_scale_level_id' => $result['overall_level']?->id,
        ])->save();

        return $appraisal->refresh();
    }

    public function resolveOverallLevel(Appraisal $appraisal, float $overallScore): ?RatingScaleLevel
    {
        $appraisal->loadMissing('template.overallRatingScale.levels');

        return $this->mapOverallLevel($appraisal, $overallScore);
    }

    private function mapOverallLevel(Appraisal $appraisal, float $overallScore): ?RatingScaleLevel
    {
        $levels = $appraisal->template->overallRatingScale->levels->sortBy('sort_order');

        return $levels->first(
            fn (RatingScaleLevel $level) => $level->min_percent !== null
                && $level->max_percent !== null
                && $overallScore >= (float) $level->min_percent
                && $overallScore <= (float) $level->max_percent
        ) ?? $levels->last();
    }
}
