<?php

namespace App\Support\Performance;

use App\Models\Appraisal;

class ScoreFormatter
{
    public static function formatPercent(float|int|string|null $value): string
    {
        if ($value === null || $value === '') {
            return '—';
        }

        $numeric = (float) $value;

        if (is_nan($numeric)) {
            return '—';
        }

        $clamped = max(0, min(100, $numeric));

        return sprintf('%d%%', (int) round($clamped));
    }

    /**
     * @return array{
     *     business: string,
     *     values: string,
     *     overall: string,
     *     rating: string,
     *     comment: string,
     *     weights: string,
     * }
     */
    public static function summaryFor(Appraisal $appraisal): array
    {
        $effectiveScore = $appraisal->calibrated_overall_score ?? $appraisal->overall_score;
        $effectiveRating = $appraisal->calibratedOverallRatingLevel?->label
            ?? $appraisal->overallRatingLevel?->label
            ?? 'Unrated';

        return [
            'business' => self::formatPercent($appraisal->business_score),
            'values' => self::formatPercent($appraisal->values_score),
            'overall' => self::formatPercent($effectiveScore),
            'rating' => $effectiveRating,
            'comment' => self::performanceComment($effectiveScore, $effectiveRating),
            'weights' => sprintf(
                '%s%% Business · %s%% Values',
                $appraisal->business_weight_percent ?? 0,
                $appraisal->values_weight_percent ?? 0,
            ),
        ];
    }

    public static function performanceComment(float|int|string|null $score, string $rating): string
    {
        if ($score === null || $score === '') {
            return 'Final score is not available yet. Complete required ratings and approvals to produce a final performance outcome.';
        }

        $numeric = (float) $score;

        if (is_nan($numeric)) {
            return 'Final score is not available yet. Complete required ratings and approvals to produce a final performance outcome.';
        }

        if ($numeric >= 80) {
            return "Overall rating is {$rating}. Performance is consistently strong against agreed targets, with clear evidence of impact and reliable delivery.";
        }

        if ($numeric >= 60) {
            return "Overall rating is {$rating}. Performance is on track in key areas, with selected objectives requiring focused improvement and follow-through.";
        }

        return "Overall rating is {$rating}. Performance is below expected standard and requires a structured improvement plan with close manager follow-up.";
    }
}
