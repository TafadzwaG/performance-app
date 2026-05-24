<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\PerformanceTrendStatus;
use App\Models\Appraisal;
use App\Models\EmployeeProfile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class EmployeePerformanceAnalyticsService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array{
     *     summary: array{
     *         improving: int,
     *         declining: int,
     *         stable: int,
     *         insufficient_data: int,
     *     },
     *     top_improving: array<int, array<string, mixed>>,
     *     top_declining: array<int, array<string, mixed>>,
     *     stable_employees: array<int, array<string, mixed>>,
     *     scorecard_comparison: array<int, array<string, mixed>>,
     *     movement_rows: array<int, array<string, mixed>>,
     * }
     */
    public function movementReport(array $filters = []): array
    {
        $rows = $this->movementRows($filters);
        $rowsWithPeers = $this->applyPeerMetrics($rows);

        $improving = $rowsWithPeers->where('trend_status', PerformanceTrendStatus::Improving->value)->values();
        $declining = $rowsWithPeers->where('trend_status', PerformanceTrendStatus::Declining->value)->values();
        $stable = $rowsWithPeers->where('trend_status', PerformanceTrendStatus::Stable->value)->values();
        $insufficient = $rowsWithPeers->where('trend_status', PerformanceTrendStatus::InsufficientData->value)->values();

        return [
            'summary' => [
                'improving' => $improving->count(),
                'declining' => $declining->count(),
                'stable' => $stable->count(),
                'insufficient_data' => $insufficient->count(),
            ],
            'top_improving' => $improving
                ->sortByDesc('score_delta')
                ->take(10)
                ->values()
                ->all(),
            'top_declining' => $declining
                ->sortBy('score_delta')
                ->take(10)
                ->values()
                ->all(),
            'stable_employees' => $stable
                ->sortBy('employee_name')
                ->take(20)
                ->values()
                ->all(),
            'scorecard_comparison' => $rowsWithPeers
                ->filter(fn (array $row) => $row['template_id'] !== null && $row['current_score'] !== null)
                ->sortBy([
                    ['template_name', 'asc'],
                    ['cohort_rank', 'asc'],
                ])
                ->values()
                ->all(),
            'movement_rows' => $rowsWithPeers->values()->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{
     *     points: array<int, array{
     *         review_cycle_id: int,
     *         cycle_name: string,
     *         score: float,
     *         finalized_at: string|null,
     *     }>,
     *     latest_score: float|null,
     *     previous_score: float|null,
     *     score_delta: float|null,
     *     trend_status: string,
     *     trend_label: string,
     *     current_cycle_name: string|null,
     *     previous_cycle_name: string|null,
     * }
     */
    public function employeeTrend(int $employeeProfileId, array $filters = []): array
    {
        $history = $this->finalizedScoredHistory($employeeProfileId);
        $comparison = $this->resolveComparisonPair($history, $filters['review_cycle_id'] ?? null);

        return [
            'points' => $history->map(fn (Appraisal $appraisal) => [
                'review_cycle_id' => $appraisal->review_cycle_id,
                'cycle_name' => $appraisal->cycle_name_snapshot ?? $appraisal->reviewCycle?->name ?? 'Unknown cycle',
                'score' => $this->effectiveOverallScore($appraisal),
                'finalized_at' => $appraisal->finalized_at?->toIso8601String(),
            ])->values()->all(),
            'latest_score' => $comparison['current_score'],
            'previous_score' => $comparison['previous_score'],
            'score_delta' => $comparison['score_delta'],
            'trend_status' => $comparison['trend_status']->value,
            'trend_label' => $comparison['trend_status']->label(),
            'current_cycle_name' => $comparison['current_cycle_name'],
            'previous_cycle_name' => $comparison['previous_cycle_name'],
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>|null
     */
    public function peerComparison(int $employeeProfileId, array $filters = []): ?array
    {
        $rows = $this->applyPeerMetrics($this->movementRows($filters));
        $enriched = $rows->firstWhere('employee_profile_id', $employeeProfileId);

        if ($enriched === null || $enriched['template_id'] === null || $enriched['current_score'] === null) {
            return null;
        }

        if (($enriched['cohort_size'] ?? 0) < 2) {
            return null;
        }

        $peers = $this->peerRowsForTemplate(
            (int) $enriched['template_id'],
            (int) $enriched['current_review_cycle_id'],
            $employeeProfileId,
        );

        return [
            'template_id' => $enriched['template_id'],
            'template_name' => $enriched['template_name'],
            'current_review_cycle_id' => $enriched['current_review_cycle_id'],
            'current_cycle_name' => $enriched['current_cycle_name'],
            'cohort_average' => $enriched['cohort_average'],
            'cohort_rank' => $enriched['cohort_rank'],
            'cohort_size' => $enriched['cohort_size'],
            'gap_from_cohort_average' => $enriched['gap_from_cohort_average'],
            'peers' => $peers,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function movementRows(array $filters = []): Collection
    {
        $normalizedFilters = $this->normalizeFilters($filters);
        $reviewCycleId = $normalizedFilters['review_cycle_id'] ?? null;
        $scopedEmployeeIds = $this->scopedEmployeeProfileIds($normalizedFilters);

        if ($scopedEmployeeIds->isEmpty()) {
            return collect();
        }

        $historyByEmployee = $this->finalizedScoredAppraisalsQuery()
            ->whereIn('employee_profile_id', $scopedEmployeeIds)
            ->with([
                'reviewCycle',
                'employeeProfile.user',
                'employeeProfile.department',
                'employeeProfile.jobTitle',
            ])
            ->get()
            ->filter(fn (Appraisal $appraisal) => $this->effectiveOverallScore($appraisal) !== null)
            ->groupBy('employee_profile_id');

        return $scopedEmployeeIds
            ->map(function (int $employeeProfileId) use ($historyByEmployee, $reviewCycleId) {
                /** @var Collection<int, Appraisal> $history */
                $history = $historyByEmployee->get($employeeProfileId, collect())
                    ->sortBy(fn (Appraisal $appraisal) => $this->cycleSortKey($appraisal))
                    ->values();

                $comparison = $this->resolveComparisonPair($history, $reviewCycleId);
                /** @var Appraisal|null $currentAppraisal */
                $currentAppraisal = $comparison['current_appraisal'];
                /** @var EmployeeProfile|null $profile */
                $profile = $currentAppraisal?->employeeProfile
                    ?? $history->last()?->employeeProfile
                    ?? EmployeeProfile::query()->with(['user', 'department', 'jobTitle'])->find($employeeProfileId);

                if ($profile === null) {
                    return null;
                }

                return [
                    'employee_profile_id' => $profile->id,
                    'employee_name' => $profile->user?->name ?? $profile->employee_number,
                    'employee_number' => $profile->employee_number,
                    'department' => $profile->department?->name,
                    'job_title' => $profile->jobTitle?->name,
                    'template_id' => $currentAppraisal?->template_id,
                    'template_name' => $currentAppraisal?->template_name_snapshot,
                    'current_review_cycle_id' => $currentAppraisal?->review_cycle_id,
                    'current_cycle_name' => $comparison['current_cycle_name'],
                    'previous_cycle_name' => $comparison['previous_cycle_name'],
                    'previous_score' => $comparison['previous_score'],
                    'current_score' => $comparison['current_score'],
                    'score_delta' => $comparison['score_delta'],
                    'trend_status' => $comparison['trend_status']->value,
                    'trend_label' => $comparison['trend_status']->label(),
                    'cohort_average' => null,
                    'cohort_rank' => null,
                    'cohort_size' => null,
                    'gap_from_cohort_average' => null,
                ];
            })
            ->filter()
            ->values();
    }

    public function effectiveOverallScore(Appraisal $appraisal): ?float
    {
        if ($appraisal->status !== AppraisalStatus::Finalized) {
            return null;
        }

        $score = $appraisal->calibrated_overall_score ?? $appraisal->overall_score;

        return $score !== null ? round((float) $score, 1) : null;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Collection<int, int>
     */
    private function scopedEmployeeProfileIds(array $filters): Collection
    {
        $query = EmployeeProfile::query()->select('employee_profiles.id');

        if ($filters['employee_profile_id'] ?? null) {
            $query->whereKey($filters['employee_profile_id']);
        }

        if ($filters['department_id'] ?? null) {
            $query->where('department_id', $filters['department_id']);
        }

        if ($filters['review_cycle_id'] ?? null) {
            $query->whereHas('appraisals', fn (Builder $appraisalQuery) => $appraisalQuery
                ->where('review_cycle_id', $filters['review_cycle_id']));
        } else {
            $query->whereHas('appraisals', fn (Builder $appraisalQuery) => $appraisalQuery
                ->where('status', AppraisalStatus::Finalized));
        }

        return $query->pluck('id');
    }

    /**
     * @return Collection<int, Appraisal>
     */
    private function finalizedScoredHistory(int $employeeProfileId): Collection
    {
        return $this->finalizedScoredAppraisalsQuery()
            ->where('employee_profile_id', $employeeProfileId)
            ->with('reviewCycle')
            ->get()
            ->filter(fn (Appraisal $appraisal) => $this->effectiveOverallScore($appraisal) !== null)
            ->sortBy(fn (Appraisal $appraisal) => $this->cycleSortKey($appraisal))
            ->values();
    }

    private function finalizedScoredAppraisalsQuery(): Builder
    {
        return Appraisal::query()
            ->where('status', AppraisalStatus::Finalized)
            ->where(function (Builder $query) {
                $query
                    ->whereNotNull('calibrated_overall_score')
                    ->orWhereNotNull('overall_score');
            });
    }

    /**
     * @param  Collection<int, Appraisal>  $history
     * @return array{
     *     current_appraisal: Appraisal|null,
     *     current_score: float|null,
     *     previous_score: float|null,
     *     score_delta: float|null,
     *     trend_status: PerformanceTrendStatus,
     *     current_cycle_name: string|null,
     *     previous_cycle_name: string|null,
     * }
     */
    private function resolveComparisonPair(Collection $history, ?int $reviewCycleId): array
    {
        if ($history->count() < 2) {
            $current = $this->resolveCurrentAppraisal($history, $reviewCycleId);

            return [
                'current_appraisal' => $current,
                'current_score' => $current ? $this->effectiveOverallScore($current) : null,
                'previous_score' => null,
                'score_delta' => null,
                'trend_status' => PerformanceTrendStatus::InsufficientData,
                'current_cycle_name' => $current ? $this->cycleLabel($current) : null,
                'previous_cycle_name' => null,
            ];
        }

        $current = $this->resolveCurrentAppraisal($history, $reviewCycleId);

        if ($current === null) {
            return [
                'current_appraisal' => null,
                'current_score' => null,
                'previous_score' => null,
                'score_delta' => null,
                'trend_status' => PerformanceTrendStatus::InsufficientData,
                'current_cycle_name' => null,
                'previous_cycle_name' => null,
            ];
        }

        $previous = $history
            ->filter(fn (Appraisal $appraisal) => $this->cycleSortKey($appraisal) < $this->cycleSortKey($current))
            ->last();

        if ($previous === null) {
            return [
                'current_appraisal' => $current,
                'current_score' => $this->effectiveOverallScore($current),
                'previous_score' => null,
                'score_delta' => null,
                'trend_status' => PerformanceTrendStatus::InsufficientData,
                'current_cycle_name' => $this->cycleLabel($current),
                'previous_cycle_name' => null,
            ];
        }

        $currentScore = $this->effectiveOverallScore($current);
        $previousScore = $this->effectiveOverallScore($previous);
        $delta = round($currentScore - $previousScore, 1);

        return [
            'current_appraisal' => $current,
            'current_score' => $currentScore,
            'previous_score' => $previousScore,
            'score_delta' => $delta,
            'trend_status' => $this->resolveTrendStatus($delta),
            'current_cycle_name' => $this->cycleLabel($current),
            'previous_cycle_name' => $this->cycleLabel($previous),
        ];
    }

    /**
     * @param  Collection<int, Appraisal>  $history
     */
    private function resolveCurrentAppraisal(Collection $history, ?int $reviewCycleId): ?Appraisal
    {
        if ($reviewCycleId !== null) {
            return $history->firstWhere('review_cycle_id', $reviewCycleId);
        }

        return $history->last();
    }

    private function resolveTrendStatus(float $delta): PerformanceTrendStatus
    {
        if ($delta > 0) {
            return PerformanceTrendStatus::Improving;
        }

        if ($delta < 0) {
            return PerformanceTrendStatus::Declining;
        }

        return PerformanceTrendStatus::Stable;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return Collection<int, array<string, mixed>>
     */
    private function applyPeerMetrics(Collection $rows): Collection
    {
        $cohorts = $rows
            ->filter(fn (array $row) => $row['template_id'] !== null && $row['current_review_cycle_id'] !== null && $row['current_score'] !== null)
            ->groupBy(fn (array $row) => $row['template_id'].'-'.$row['current_review_cycle_id']);

        $metricsByKey = $cohorts->map(function (Collection $cohortRows) {
            $sorted = $cohortRows->sortByDesc('current_score')->values();
            $average = round((float) $sorted->avg('current_score'), 1);

            return $sorted->map(function (array $row, int $index) use ($average, $sorted) {
                $rank = $index + 1;

                return [
                    ...$row,
                    'cohort_average' => $average,
                    'cohort_rank' => $rank,
                    'cohort_size' => $sorted->count(),
                    'gap_from_cohort_average' => round((float) $row['current_score'] - $average, 1),
                ];
            });
        })->flatten(1)->keyBy('employee_profile_id');

        return $rows->map(function (array $row) use ($metricsByKey) {
            return $metricsByKey->get($row['employee_profile_id'], $row);
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function peerRowsForTemplate(int $templateId, int $reviewCycleId, int $excludeEmployeeProfileId): array
    {
        return $this->finalizedScoredAppraisalsQuery()
            ->where('template_id', $templateId)
            ->where('review_cycle_id', $reviewCycleId)
            ->where('employee_profile_id', '!=', $excludeEmployeeProfileId)
            ->with(['employeeProfile.user', 'employeeProfile.jobTitle'])
            ->get()
            ->filter(fn (Appraisal $appraisal) => $this->effectiveOverallScore($appraisal) !== null)
            ->sortByDesc(fn (Appraisal $appraisal) => $this->effectiveOverallScore($appraisal))
            ->map(fn (Appraisal $appraisal) => [
                'employee_profile_id' => $appraisal->employee_profile_id,
                'employee_name' => $appraisal->employeeProfile?->user?->name ?? $appraisal->employee_name_snapshot,
                'employee_number' => $appraisal->employee_number_snapshot,
                'job_title' => $appraisal->employeeProfile?->jobTitle?->name ?? $appraisal->job_title_name_snapshot,
                'current_score' => $this->effectiveOverallScore($appraisal),
            ])
            ->values()
            ->all();
    }

    private function cycleLabel(Appraisal $appraisal): string
    {
        return $appraisal->cycle_name_snapshot ?? $appraisal->reviewCycle?->name ?? 'Unknown cycle';
    }

    private function cycleSortKey(Appraisal $appraisal): string
    {
        $endDate = $appraisal->reviewCycle?->end_date?->format('Y-m-d') ?? '9999-12-31';
        $finalizedAt = $appraisal->finalized_at?->format('Y-m-d H:i:s') ?? '9999-12-31 23:59:59';

        return "{$endDate}|{$finalizedAt}|{$appraisal->id}";
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function normalizeFilters(array $filters): array
    {
        return [
            'review_cycle_id' => $filters['review_cycle_id'] ?? null,
            'department_id' => $filters['department_id'] ?? null,
            'employee_profile_id' => $filters['employee_profile_id'] ?? null,
        ];
    }
}
