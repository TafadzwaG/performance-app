<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\CompetencyCategory;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\AppraisalComment;
use App\Models\AppraisalCompetencyRating;
use App\Models\AppraisalObjective;
use App\Models\Competency;
use App\Models\ReviewCycle;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class WelcomePlatformStatsService
{
    private const EFFECTIVE_OVERALL_SCORE_SQL = 'coalesce(appraisals.calibrated_overall_score, appraisals.overall_score)';

    private const CACHE_KEY = 'welcome.platform_stats.v2';

    private const CACHE_TTL_SECONDS = 300;

    /**
     * @return array<string, mixed>
     */
    public function snapshot(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, fn () => $this->buildSnapshot());
    }

    /**
     * @return array<string, mixed>
     */
    private function buildSnapshot(): array
    {
        $performanceTrend = $this->performanceTrend();
        $competencyMix = $this->competencyMix();
        $snapshot = $this->scoreSnapshot();
        $goals = $this->goalProgress();
        $feedbackVelocity = $this->feedbackVelocity();

        $hasData = $performanceTrend['points'] !== []
            || $competencyMix['items'] !== []
            || $snapshot['score'] !== null
            || $goals['total'] > 0
            || $feedbackVelocity['total_this_month'] > 0;

        return [
            'has_data' => $hasData,
            'company_values' => $this->companyValues(),
            'performance_trend' => $performanceTrend,
            'competency_mix' => $competencyMix,
            'snapshot' => $snapshot,
            'goals' => $goals,
            'feedback_velocity' => $feedbackVelocity,
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, code: string|null, description: string|null}>
     */
    private function companyValues(): array
    {
        return Competency::query()
            ->where('category', CompetencyCategory::Value)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'description'])
            ->map(fn (Competency $competency) => [
                'id' => $competency->id,
                'name' => $competency->name,
                'code' => $competency->code,
                'description' => $competency->description,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{points: array<int, array{month: string, score: float}>, ytd_change: float|null, sample_size: int, period_label: string}
     */
    private function performanceTrend(): array
    {
        $start = now()->subMonths(7)->startOfMonth();

        $appraisals = Appraisal::query()
            ->where('status', AppraisalStatus::Finalized)
            ->whereNotNull('finalized_at')
            ->where('finalized_at', '>=', $start)
            ->get(['finalized_at', 'overall_score', 'calibrated_overall_score']);

        $points = collect(range(0, 7))
            ->map(function (int $offset) use ($start, $appraisals) {
                $month = $start->copy()->addMonths($offset);
                $key = $month->format('Y-m');
                $monthAppraisals = $appraisals->filter(
                    fn (Appraisal $appraisal) => $appraisal->finalized_at?->format('Y-m') === $key,
                );

                $average = $monthAppraisals->isEmpty()
                    ? null
                    : round((float) $monthAppraisals->avg(
                        fn (Appraisal $appraisal) => (float) ($appraisal->calibrated_overall_score ?? $appraisal->overall_score ?? 0),
                    ), 1);

                return [
                    'month' => $month->format('M'),
                    'score' => $average,
                ];
            })
            ->filter(fn (array $point) => $point['score'] !== null)
            ->values()
            ->all();

        $firstScore = $points[0]['score'] ?? null;
        $lastScore = $points[array_key_last($points)]['score'] ?? null;
        $ytdChange = ($firstScore !== null && $lastScore !== null)
            ? round($lastScore - $firstScore, 1)
            : null;

        $periodStart = $start->format('M');
        $periodEnd = now()->format('M Y');

        return [
            'points' => $points,
            'ytd_change' => $ytdChange,
            'sample_size' => $appraisals->count(),
            'period_label' => "{$periodStart} → {$periodEnd}",
        ];
    }

    /**
     * @return array{items: array<int, array{name: string, value: float}>, pillar_count: int}
     */
    private function competencyMix(): array
    {
        $counts = AppraisalCompetencyRating::query()
            ->join('competencies', 'competencies.id', '=', 'appraisal_competency_ratings.competency_id')
            ->whereNotNull('appraisal_competency_ratings.manager_rating_score')
            ->selectRaw('competencies.category as category, count(*) as total')
            ->groupBy('competencies.category')
            ->pluck('total', 'category');

        if ($counts->isEmpty()) {
            return [
                'items' => [],
                'pillar_count' => 0,
            ];
        }

        $total = (int) $counts->sum();

        $items = $counts
            ->map(function (int $count, string $category) use ($total) {
                $enum = CompetencyCategory::tryFrom($category);

                return [
                    'name' => match ($enum) {
                        CompetencyCategory::Value => 'Values',
                        CompetencyCategory::Behaviour => 'Behaviours',
                        default => 'Competencies',
                    },
                    'value' => round(($count / $total) * 100, 1),
                ];
            })
            ->sortByDesc('value')
            ->values()
            ->all();

        return [
            'items' => $items,
            'pillar_count' => count($items),
        ];
    }

    /**
     * @return array{score: float|null, previous_score: float|null, max_score: int}
     */
    private function scoreSnapshot(): array
    {
        $currentAverage = Appraisal::query()
            ->where('status', AppraisalStatus::Finalized)
            ->whereRaw(self::EFFECTIVE_OVERALL_SCORE_SQL.' is not null')
            ->where('finalized_at', '>=', now()->subMonths(3)->startOfMonth())
            ->selectRaw('avg('.self::EFFECTIVE_OVERALL_SCORE_SQL.') as average_score')
            ->value('average_score');

        $previousAverage = Appraisal::query()
            ->where('status', AppraisalStatus::Finalized)
            ->whereRaw(self::EFFECTIVE_OVERALL_SCORE_SQL.' is not null')
            ->whereBetween('finalized_at', [
                now()->subMonths(6)->startOfMonth(),
                now()->subMonths(3)->startOfMonth()->subSecond(),
            ])
            ->selectRaw('avg('.self::EFFECTIVE_OVERALL_SCORE_SQL.') as average_score')
            ->value('average_score');

        return [
            'score' => $currentAverage !== null ? round((float) $currentAverage, 1) : null,
            'previous_score' => $previousAverage !== null ? round((float) $previousAverage, 1) : null,
            'max_score' => 100,
        ];
    }

    /**
     * @return array{completed: int, total: int, completion_rate: float, cycle_label: string|null}
     */
    private function goalProgress(): array
    {
        $cycle = ReviewCycle::query()
            ->where('status', ReviewCycleStatus::Open)
            ->orderByDesc('start_date')
            ->first()
            ?? ReviewCycle::query()->orderByDesc('start_date')->first();

        if (! $cycle) {
            return [
                'completed' => 0,
                'total' => 0,
                'completion_rate' => 0.0,
                'cycle_label' => null,
            ];
        }

        $objectives = AppraisalObjective::query()
            ->whereHas('appraisal', fn ($query) => $query->where('review_cycle_id', $cycle->id))
            ->get(['manager_rating_score', 'performance_achieved']);

        $total = $objectives->count();
        $completed = $objectives->filter(
            fn (AppraisalObjective $objective) => $objective->manager_rating_score !== null
                || filled($objective->performance_achieved),
        )->count();

        return [
            'completed' => $completed,
            'total' => $total,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0.0,
            'cycle_label' => $cycle->name,
        ];
    }

    /**
     * @return array{total_this_month: int, weekly_counts: array<int, int>, period_growth_percent: float|null}
     */
    private function feedbackVelocity(): array
    {
        $start = now()->subWeeks(11)->startOfWeek();

        /** @var Collection<int, AppraisalComment> $comments */
        $comments = AppraisalComment::query()
            ->where('created_at', '>=', $start)
            ->get(['created_at']);

        $weeklyCounts = collect(range(0, 11))
            ->map(function (int $offset) use ($start, $comments) {
                $weekStart = $start->copy()->addWeeks($offset)->startOfWeek();
                $weekEnd = $weekStart->copy()->endOfWeek();

                return $comments->filter(
                    fn (AppraisalComment $comment) => $comment->created_at->between($weekStart, $weekEnd),
                )->count();
            })
            ->all();

        $totalThisMonth = AppraisalComment::query()
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $recent = array_sum(array_slice($weeklyCounts, -4));
        $previous = array_sum(array_slice($weeklyCounts, -8, 4));
        $periodGrowth = $previous > 0
            ? round((($recent - $previous) / $previous) * 100, 1)
            : ($recent > 0 ? 100.0 : null);

        return [
            'total_this_month' => $totalThisMonth,
            'weekly_counts' => $weeklyCounts,
            'period_growth_percent' => $periodGrowth,
        ];
    }
}
