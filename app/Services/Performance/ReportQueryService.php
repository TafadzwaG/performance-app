<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Models\Appraisal;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class ReportQueryService
{
    private const DASHBOARD_CACHE_TTL_SECONDS = 300;

    private const EFFECTIVE_OVERALL_SCORE_SQL = 'coalesce(appraisals.calibrated_overall_score, appraisals.overall_score)';

    private const EFFECTIVE_OVERALL_RATING_LABEL_SQL = 'coalesce(calibrated_rating_scale_levels.label, original_rating_scale_levels.label, "Unrated")';

    public function dashboard(User $user): array
    {
        return Cache::remember(
            "performance:dashboard:user:{$user->id}",
            self::DASHBOARD_CACHE_TTL_SECONDS,
            fn () => $this->buildDashboard($user),
        );
    }

    public function comprehensiveReports(array|int|null $filters = null): array
    {
        $normalizedFilters = $this->normalizeFilters($filters);
        $query = $this->baseReportQuery($normalizedFilters);
        $appraisals = (clone $query)
            ->with(['reviewCycle', 'lineManager', 'approvingManager'])
            ->get();

        $total = $appraisals->count();
        $finalized = $appraisals->where('status', AppraisalStatus::Finalized)->count();
        $sentBack = $appraisals->where('status', AppraisalStatus::SentBack)->count();
        $overdueItems = $this->overdueVisibleAppraisals(clone $query);
        $overdueCount = $overdueItems->count();
        $scores = $appraisals
            ->filter(fn (Appraisal $appraisal) => $appraisal->status === AppraisalStatus::Finalized && $this->effectiveOverallScore($appraisal) !== null)
            ->map(fn (Appraisal $appraisal) => $this->effectiveOverallScore($appraisal))
            ->map(fn ($score) => (float) $score)
            ->sort()
            ->values();
        $businessAverage = $appraisals
            ->filter(fn (Appraisal $appraisal) => $appraisal->status === AppraisalStatus::Finalized && $appraisal->business_score !== null)
            ->avg(fn (Appraisal $appraisal) => (float) $appraisal->business_score);
        $valuesAverage = $appraisals
            ->filter(fn (Appraisal $appraisal) => $appraisal->status === AppraisalStatus::Finalized && $appraisal->values_score !== null)
            ->avg(fn (Appraisal $appraisal) => (float) $appraisal->values_score);

        return [
            'executive_summary' => [
                'total_appraisals' => $total,
                'finalized_reviews' => $finalized,
                'completion_rate' => $total > 0 ? round(($finalized / $total) * 100, 1) : 0.0,
                'open_reviews' => $appraisals->whereNotIn('status', [AppraisalStatus::Finalized])->count(),
                'overdue_reviews' => $overdueCount,
                'overdue_rate' => $total > 0 ? round(($overdueCount / $total) * 100, 1) : 0.0,
                'sent_back_count' => $sentBack,
                'sent_back_rate' => $total > 0 ? round(($sentBack / $total) * 100, 1) : 0.0,
                'average_score' => round((float) ($scores->avg() ?? 0), 1),
            ],
            'workflow_pipeline' => $this->comprehensiveWorkflowPipeline($appraisals),
            'department_breakdown' => $this->comprehensiveDepartmentBreakdown($appraisals, $overdueItems),
            'manager_accountability' => $this->comprehensiveManagerAccountability($appraisals, $overdueItems),
            'employee_exception_report' => $this->comprehensiveEmployeeExceptions($appraisals, $overdueItems),
            'rating_quality' => [
                'average_score' => round((float) ($scores->avg() ?? 0), 1),
                'median_score' => $this->median($scores),
                'highest_score' => round((float) ($scores->max() ?? 0), 1),
                'lowest_score' => round((float) ($scores->min() ?? 0), 1),
                'score_spread' => $scores->isNotEmpty() ? round($scores->max() - $scores->min(), 1) : 0.0,
                'business_average' => round((float) ($businessAverage ?? 0), 1),
                'values_average' => round((float) ($valuesAverage ?? 0), 1),
                'business_values_gap' => $businessAverage !== null && $valuesAverage !== null ? round(abs((float) $businessAverage - (float) $valuesAverage), 1) : 0.0,
                'unrated_finalized_reviews' => $appraisals
                    ->filter(fn (Appraisal $appraisal) => $appraisal->status === AppraisalStatus::Finalized && $this->effectiveOverallScore($appraisal) === null)
                    ->count(),
            ],
            'overdue_analysis' => $this->comprehensiveOverdueAnalysis($overdueItems),
            'cycle_comparison' => $this->comprehensiveCycleComparison($normalizedFilters, $appraisals),
        ];
    }

    private function buildDashboard(User $user): array
    {
        $ownQuery = $this->ownAppraisals($user);
        $teamQuery = $this->teamAppraisals($user);
        $approvalQuery = $this->approvalAppraisals($user);
        $visibleQuery = $this->dashboardVisibleAppraisals($user);

        return [
            'metrics' => [
                'my_open_appraisals' => (clone $ownQuery)->whereNotIn('status', ['finalized'])->count(),
                'team_pending_reviews' => (clone $teamQuery)->where('status', 'manager_review_pending')->count(),
                'pending_approvals' => (clone $approvalQuery)->where('status', 'approval_pending')->count(),
                'overdue_reviews' => $this->overdueVisibleAppraisals(clone $visibleQuery)->count(),
                'open_cycles' => ReviewCycle::query()->where('status', 'open')->count(),
                'finalized_reviews' => (clone $visibleQuery)->whereNotNull('finalized_at')->count(),
            ],
            'focus_cycle' => $this->focusCycle(),
            'workflow_distribution' => $this->workflowDistribution($visibleQuery),
            'rating_distribution' => $this->dashboardRatingDistribution($visibleQuery),
            'cycle_performance' => $this->cyclePerformance($visibleQuery),
            'department_performance' => $this->departmentPerformance($visibleQuery),
            'deadline_pressure' => $this->deadlinePressure($visibleQuery),
            'stage_completion' => $this->stageCompletion($visibleQuery),
            'overdue_severity' => $this->overdueSeverity($visibleQuery),
            'cycle_health' => $this->cycleHealth($visibleQuery),
            'manager_workload' => $this->managerWorkload($visibleQuery),
            'department_risk' => $this->departmentRisk($visibleQuery),
            'score_quality' => $this->scoreQuality($visibleQuery),
            'rework' => $this->rework($visibleQuery),
            'coverage' => $this->coverage($visibleQuery),
            'trend_deltas' => $this->trendDeltas($visibleQuery),
            'action_summary' => $this->actionSummary($user),
        ];
    }

    public function cycleSummary(array|int|null $filters = null): Collection
    {
        return $this->baseReportQuery($this->normalizeFilters($filters))
            ->selectRaw('cycle_name_snapshot as cycle, count(*) as total, avg('.self::EFFECTIVE_OVERALL_SCORE_SQL.') as average_score')
            ->groupBy('cycle_name_snapshot')
            ->get();
    }

    public function departmentSummary(array|int|null $filters = null): Collection
    {
        return $this->baseReportQuery($this->normalizeFilters($filters))
            ->selectRaw('department_name_snapshot as department, count(*) as total, avg('.self::EFFECTIVE_OVERALL_SCORE_SQL.') as average_score')
            ->groupBy('department_name_snapshot')
            ->get();
    }

    public function employeeSummary(array|int|null $filters = null): Collection
    {
        return $this->baseReportQuery($this->normalizeFilters($filters))
            ->select([
                'id',
                'employee_name_snapshot',
                'employee_number_snapshot',
                'cycle_name_snapshot',
                'status',
                'business_score',
                'values_score',
            ])
            ->selectRaw(self::EFFECTIVE_OVERALL_SCORE_SQL.' as effective_overall_score')
            ->get();
    }

    public function completionStatus(array|int|null $filters = null): Collection
    {
        return $this->baseReportQuery($this->normalizeFilters($filters))
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get();
    }

    public function ratingDistribution(array|int|null $filters = null): Collection
    {
        return $this->baseReportQuery($this->normalizeFilters($filters))
            ->leftJoin('rating_scale_levels as original_rating_scale_levels', 'original_rating_scale_levels.id', '=', 'appraisals.overall_rating_scale_level_id')
            ->leftJoin('rating_scale_levels as calibrated_rating_scale_levels', 'calibrated_rating_scale_levels.id', '=', 'appraisals.calibrated_overall_rating_scale_level_id')
            ->selectRaw(self::EFFECTIVE_OVERALL_RATING_LABEL_SQL.' as rating, count(*) as total')
            ->groupByRaw(self::EFFECTIVE_OVERALL_RATING_LABEL_SQL)
            ->get();
    }

    public function overdueReviews(array|int|null $filters = null, ?User $user = null): Collection
    {
        $query = $user instanceof User
            ? $this->dashboardVisibleAppraisals($user)
            : $this->baseReportQuery($this->normalizeFilters($filters));

        return (clone $query)
            ->join('review_cycles', 'review_cycles.id', '=', 'appraisals.review_cycle_id')
            ->where(function (Builder $query) {
                $query->where(function (Builder $self) {
                    $self->where('appraisals.status', 'self_assessment_pending')
                        ->whereDate('review_cycles.self_assessment_deadline', '<', now()->toDateString());
                })->orWhere(function (Builder $manager) {
                    $manager->where('appraisals.status', 'manager_review_pending')
                        ->whereDate('review_cycles.manager_review_deadline', '<', now()->toDateString());
                })->orWhere(function (Builder $approval) {
                    $approval->where('appraisals.status', 'approval_pending')
                        ->whereDate('review_cycles.approval_deadline', '<', now()->toDateString());
                });
            })
            ->select('appraisals.*')
            ->get();
    }

    private function baseReportQuery(array $filters = []): Builder
    {
        return Appraisal::query()
            ->when($filters['review_cycle_id'] ?? null, fn (Builder $query, int $reviewCycleId) => $query->where('review_cycle_id', $reviewCycleId))
            ->when($filters['department_id'] ?? null, fn (Builder $query, int $departmentId) => $query->whereHas('employeeProfile', fn (Builder $profile) => $profile->where('department_id', $departmentId)))
            ->when($filters['employee_profile_id'] ?? null, fn (Builder $query, int $employeeProfileId) => $query->where('employee_profile_id', $employeeProfileId));
    }

    private function ownAppraisals(User $user): Builder
    {
        return Appraisal::query()->where('employee_user_id', $user->id);
    }

    private function teamAppraisals(User $user): Builder
    {
        return Appraisal::query()->where('line_manager_user_id', $user->id);
    }

    private function approvalAppraisals(User $user): Builder
    {
        return Appraisal::query()->where('approving_manager_user_id', $user->id);
    }

    private function dashboardVisibleAppraisals(User $user): Builder
    {
        if ($user->can('performance.reports.view') || $user->can('performance.appraisals.view_all')) {
            return Appraisal::query();
        }

        return Appraisal::query()->where(function (Builder $query) use ($user) {
            $query
                ->where('employee_user_id', $user->id)
                ->orWhere('line_manager_user_id', $user->id)
                ->orWhere('approving_manager_user_id', $user->id);
        });
    }

    private function focusCycle(): ?array
    {
        $cycle = ReviewCycle::query()
            ->where('status', 'open')
            ->withCount('appraisals')
            ->withCount([
                'appraisals as self_assessment_pending_count' => fn (Builder $query) => $query->where('status', 'self_assessment_pending'),
                'appraisals as manager_review_pending_count' => fn (Builder $query) => $query->where('status', 'manager_review_pending'),
                'appraisals as approval_pending_count' => fn (Builder $query) => $query->where('status', 'approval_pending'),
                'appraisals as finalized_count' => fn (Builder $query) => $query->where('status', 'finalized'),
            ])
            ->orderBy('start_date')
            ->first();

        if (! $cycle) {
            return null;
        }

        $completionRate = $cycle->appraisals_count > 0
            ? round(($cycle->finalized_count / $cycle->appraisals_count) * 100, 1)
            : 0;

        $statusCounts = $cycle->appraisals()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $countFor = fn (array $statuses): int => collect($statuses)
            ->sum(fn (string $status) => (int) ($statusCounts[$status] ?? 0));

        return [
            'id' => $cycle->id,
            'name' => $cycle->name,
            'code' => $cycle->code,
            'status' => (string) $cycle->status->value,
            'start_date' => optional($cycle->start_date)->toDateString(),
            'end_date' => optional($cycle->end_date)->toDateString(),
            'goal_setting_deadline' => optional($cycle->goal_setting_deadline)->toDateString(),
            'self_assessment_deadline' => optional($cycle->self_assessment_deadline)->toDateString(),
            'manager_review_deadline' => optional($cycle->manager_review_deadline)->toDateString(),
            'approval_deadline' => optional($cycle->approval_deadline)->toDateString(),
            'appraisals_count' => $cycle->appraisals_count,
            'self_assessment_pending_count' => $cycle->self_assessment_pending_count,
            'manager_review_pending_count' => $cycle->manager_review_pending_count,
            'approval_pending_count' => $cycle->approval_pending_count,
            'finalized_count' => $cycle->finalized_count,
            'completion_rate' => $completionRate,
            'pipeline' => [
                ['stage' => 'Goal setting', 'count' => $countFor(['draft', 'goal_setting'])],
                ['stage' => 'Self assessment', 'count' => $countFor(['self_assessment_pending', 'self_assessment_submitted'])],
                ['stage' => 'Manager review', 'count' => $countFor(['manager_review_pending', 'manager_review_completed'])],
                ['stage' => 'Approval', 'count' => $countFor(['approval_pending', 'approved', 'calibration_pending', 'sent_back'])],
                ['stage' => 'Finalized', 'count' => $countFor(['finalized'])],
            ],
        ];
    }

    private function workflowDistribution(Builder $query): Collection
    {
        return (clone $query)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->orderByRaw("
                case status
                    when 'draft' then 1
                    when 'goal_setting' then 2
                    when 'self_assessment_pending' then 3
                    when 'self_assessment_submitted' then 4
                    when 'manager_review_pending' then 5
                    when 'manager_review_completed' then 6
                    when 'approval_pending' then 7
                    when 'approved' then 8
                    when 'calibration_pending' then 9
                    when 'sent_back' then 10
                    when 'finalized' then 11
                    else 99
                end
            ")
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'total' => (int) $row->total,
            ]);
    }

    private function dashboardRatingDistribution(Builder $query): Collection
    {
        return (clone $query)
            ->leftJoin('rating_scale_levels as original_rating_scale_levels', 'original_rating_scale_levels.id', '=', 'appraisals.overall_rating_scale_level_id')
            ->leftJoin('rating_scale_levels as calibrated_rating_scale_levels', 'calibrated_rating_scale_levels.id', '=', 'appraisals.calibrated_overall_rating_scale_level_id')
            ->selectRaw(self::EFFECTIVE_OVERALL_RATING_LABEL_SQL.' as rating, count(*) as total')
            ->groupByRaw(self::EFFECTIVE_OVERALL_RATING_LABEL_SQL)
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'rating' => $row->rating,
                'total' => (int) $row->total,
            ]);
    }

    private function cyclePerformance(Builder $query): Collection
    {
        return (clone $query)
            ->join('review_cycles', 'review_cycles.id', '=', 'appraisals.review_cycle_id')
            ->selectRaw('
                appraisals.review_cycle_id,
                appraisals.cycle_name_snapshot as cycle,
                count(*) as total,
                avg('.self::EFFECTIVE_OVERALL_SCORE_SQL.') as average_score,
                max(review_cycles.end_date) as cycle_end_date
            ')
            ->groupBy('appraisals.review_cycle_id', 'appraisals.cycle_name_snapshot')
            ->orderBy('cycle_end_date')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'cycle' => $row->cycle,
                'total' => (int) $row->total,
                'average_score' => round((float) ($row->average_score ?? 0), 1),
            ]);
    }

    private function departmentPerformance(Builder $query): Collection
    {
        return (clone $query)
            ->whereNotNull('department_name_snapshot')
            ->whereRaw(self::EFFECTIVE_OVERALL_SCORE_SQL.' is not null')
            ->selectRaw('
                department_name_snapshot as department,
                count(*) as total,
                avg('.self::EFFECTIVE_OVERALL_SCORE_SQL.') as average_score
            ')
            ->groupBy('department_name_snapshot')
            ->orderByDesc('average_score')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'department' => $row->department,
                'total' => (int) $row->total,
                'average_score' => round((float) $row->average_score, 1),
            ]);
    }

    private function deadlinePressure(Builder $query): Collection
    {
        $rows = (clone $query)
            ->join('review_cycles', 'review_cycles.id', '=', 'appraisals.review_cycle_id')
            ->selectRaw("
                sum(case when appraisals.status = 'self_assessment_pending' and review_cycles.self_assessment_deadline < current_date then 1 else 0 end) as self_assessment,
                sum(case when appraisals.status = 'manager_review_pending' and review_cycles.manager_review_deadline < current_date then 1 else 0 end) as manager_review,
                sum(case when appraisals.status = 'approval_pending' and review_cycles.approval_deadline < current_date then 1 else 0 end) as approval
            ")
            ->first();

        return collect([
            ['stage' => 'Self Assessment', 'total' => (int) ($rows->self_assessment ?? 0)],
            ['stage' => 'Manager Review', 'total' => (int) ($rows->manager_review ?? 0)],
            ['stage' => 'Approval', 'total' => (int) ($rows->approval ?? 0)],
        ]);
    }

    private function stageCompletion(Builder $query): Collection
    {
        $cycle = $this->focusCycle();
        $cycleQuery = $cycle
            ? (clone $query)->where('review_cycle_id', $cycle['id'])
            : clone $query;

        $total = (clone $cycleQuery)->count();

        return collect([
            [
                'stage' => 'Self Assessment',
                'completed' => (clone $cycleQuery)->whereNotIn('status', ['draft', 'goal_setting', 'self_assessment_pending'])->count(),
                'total' => $total,
            ],
            [
                'stage' => 'Manager Review',
                'completed' => (clone $cycleQuery)->whereNotIn('status', ['draft', 'goal_setting', 'self_assessment_pending', 'self_assessment_submitted', 'manager_review_pending'])->count(),
                'total' => $total,
            ],
            [
                'stage' => 'Approval',
                'completed' => (clone $cycleQuery)->whereIn('status', ['approved', 'calibration_pending', 'finalized'])->count(),
                'total' => $total,
            ],
            [
                'stage' => 'Finalization',
                'completed' => (clone $cycleQuery)->where('status', 'finalized')->count(),
                'total' => $total,
            ],
        ])->map(fn (array $stage) => [
            ...$stage,
            'completion_rate' => $stage['total'] > 0 ? round(($stage['completed'] / $stage['total']) * 100, 1) : 0.0,
        ]);
    }

    private function comprehensiveWorkflowPipeline(Collection $appraisals): Collection
    {
        $total = $appraisals->count();

        return $appraisals
            ->groupBy(fn (Appraisal $appraisal) => $appraisal->status->value)
            ->map(fn (Collection $rows, string $status) => [
                'status' => $status,
                'label' => $this->statusLabel($status),
                'total' => $rows->count(),
                'share' => $total > 0 ? round(($rows->count() / $total) * 100, 1) : 0.0,
            ])
            ->sortBy(fn (array $row) => $this->statusSort($row['status']))
            ->values();
    }

    private function comprehensiveDepartmentBreakdown(Collection $appraisals, Collection $overdueItems): Collection
    {
        $overdueByDepartment = $overdueItems
            ->groupBy('department_name_snapshot')
            ->map->count();

        return $appraisals
            ->groupBy(fn (Appraisal $appraisal) => $appraisal->department_name_snapshot ?: 'Unassigned')
            ->map(function (Collection $rows, string $department) use ($overdueByDepartment) {
                $total = $rows->count();
                $finalized = $rows->where('status', AppraisalStatus::Finalized)->count();
                $overdue = (int) ($overdueByDepartment->get($department) ?? 0);
                $completionRate = $total > 0 ? round(($finalized / $total) * 100, 1) : 0.0;
                $overdueRate = $total > 0 ? round(($overdue / $total) * 100, 1) : 0.0;
                $averageScore = round((float) ($rows->where('status', AppraisalStatus::Finalized)->avg(fn (Appraisal $appraisal) => (float) ($this->effectiveOverallScore($appraisal) ?? 0)) ?? 0), 1);

                return [
                    'department' => $department,
                    'total' => $total,
                    'finalized' => $finalized,
                    'completion_rate' => $completionRate,
                    'average_score' => $averageScore,
                    'overdue_count' => $overdue,
                    'overdue_rate' => $overdueRate,
                    'sent_back_count' => $rows->where('status', AppraisalStatus::SentBack)->count(),
                    'risk_level' => $this->riskLevel($completionRate, $overdueRate),
                ];
            })
            ->sortByDesc(fn (array $row) => $row['overdue_rate'] + (100 - $row['completion_rate']))
            ->values();
    }

    private function comprehensiveManagerAccountability(Collection $appraisals, Collection $overdueItems): Collection
    {
        $overdueByManager = $overdueItems
            ->groupBy('line_manager_user_id')
            ->map->count();

        return $appraisals
            ->filter(fn (Appraisal $appraisal) => $appraisal->line_manager_user_id !== null)
            ->groupBy('line_manager_user_id')
            ->map(function (Collection $rows, int|string $managerId) use ($overdueByManager) {
                $reviewedRows = $rows->filter(fn (Appraisal $appraisal) => $appraisal->self_assessment_submitted_at && $appraisal->manager_reviewed_at);

                return [
                    'manager' => $rows->first()?->lineManager?->name ?? 'Unassigned',
                    'assigned_reviews' => $rows->count(),
                    'pending_manager_reviews' => $rows->where('status', AppraisalStatus::ManagerReviewPending)->count(),
                    'overdue_reviews' => (int) ($overdueByManager->get($managerId) ?? 0),
                    'sent_back_count' => $rows->where('status', AppraisalStatus::SentBack)->count(),
                    'average_turnaround_days' => $reviewedRows->isNotEmpty()
                        ? round($reviewedRows->avg(fn (Appraisal $appraisal) => $appraisal->self_assessment_submitted_at->diffInDays($appraisal->manager_reviewed_at)), 1)
                        : 0.0,
                ];
            })
            ->sortByDesc(fn (array $row) => $row['overdue_reviews'] + $row['pending_manager_reviews'])
            ->values();
    }

    private function comprehensiveEmployeeExceptions(Collection $appraisals, Collection $overdueItems): Collection
    {
        $overdueByAppraisal = $overdueItems->keyBy('id');

        return $appraisals
            ->map(function (Appraisal $appraisal) use ($overdueByAppraisal) {
                $overdue = $overdueByAppraisal->get($appraisal->id);
                $flags = collect();

                if ($overdue) {
                    $flags->push('Overdue '.$overdue['days_overdue'].' day(s)');
                }

                if ($appraisal->status === AppraisalStatus::SentBack) {
                    $flags->push('Sent back for rework');
                }

                if ($appraisal->status === AppraisalStatus::Finalized && $this->effectiveOverallScore($appraisal) === null) {
                    $flags->push('Finalized without score');
                }

                if ($flags->isEmpty()) {
                    return null;
                }

                return [
                    'employee' => $appraisal->employee_name_snapshot,
                    'employee_number' => $appraisal->employee_number_snapshot,
                    'department' => $appraisal->department_name_snapshot,
                    'cycle' => $appraisal->cycle_name_snapshot,
                    'status' => $appraisal->status->value,
                    'manager' => $appraisal->lineManager?->name ?? 'Unassigned',
                    'flags' => $flags->implode(', '),
                    'days_overdue' => (int) ($overdue['days_overdue'] ?? 0),
                    'effective_overall_score' => $this->effectiveOverallScore($appraisal),
                ];
            })
            ->filter()
            ->sortByDesc(fn (array $row) => $row['days_overdue'])
            ->values();
    }

    private function comprehensiveOverdueAnalysis(Collection $overdueItems): array
    {
        return [
            'total_overdue' => $overdueItems->count(),
            'average_days_overdue' => $overdueItems->isNotEmpty() ? round($overdueItems->avg('days_overdue'), 1) : 0.0,
            'oldest_days_overdue' => (int) ($overdueItems->max('days_overdue') ?? 0),
            'buckets' => collect([
                ['bucket' => '1-3 days', 'total' => $overdueItems->filter(fn (array $item) => $item['days_overdue'] <= 3)->count()],
                ['bucket' => '4-7 days', 'total' => $overdueItems->filter(fn (array $item) => $item['days_overdue'] >= 4 && $item['days_overdue'] <= 7)->count()],
                ['bucket' => '8+ days', 'total' => $overdueItems->filter(fn (array $item) => $item['days_overdue'] >= 8)->count()],
            ]),
        ];
    }

    private function comprehensiveCycleComparison(array $filters, Collection $currentAppraisals): array
    {
        $currentCycle = isset($filters['review_cycle_id'])
            ? ReviewCycle::query()->find($filters['review_cycle_id'])
            : ReviewCycle::query()->orderByDesc('end_date')->first();

        $previousCycle = $currentCycle
            ? ReviewCycle::query()
                ->where('id', '!=', $currentCycle->id)
                ->whereDate('end_date', '<=', $currentCycle->end_date)
                ->orderByDesc('end_date')
                ->first()
            : null;

        $previousAppraisals = $previousCycle
            ? Appraisal::query()->where('review_cycle_id', $previousCycle->id)->get()
            : collect();

        $currentAverage = round((float) ($currentAppraisals->where('status', AppraisalStatus::Finalized)->avg(fn (Appraisal $appraisal) => (float) ($this->effectiveOverallScore($appraisal) ?? 0)) ?? 0), 1);
        $previousAverage = round((float) ($previousAppraisals->where('status', AppraisalStatus::Finalized)->avg(fn (Appraisal $appraisal) => (float) ($this->effectiveOverallScore($appraisal) ?? 0)) ?? 0), 1);
        $currentCompletion = $currentAppraisals->isNotEmpty() ? round(($currentAppraisals->where('status', AppraisalStatus::Finalized)->count() / $currentAppraisals->count()) * 100, 1) : 0.0;
        $previousCompletion = $previousAppraisals->isNotEmpty() ? round(($previousAppraisals->where('status', AppraisalStatus::Finalized)->count() / $previousAppraisals->count()) * 100, 1) : 0.0;

        return [
            'current_cycle' => $currentCycle?->name ?? 'Current selection',
            'previous_cycle' => $previousCycle?->name,
            'current_average_score' => $currentAverage,
            'previous_average_score' => $previousAverage,
            'average_score_delta' => round($currentAverage - $previousAverage, 1),
            'current_completion_rate' => $currentCompletion,
            'previous_completion_rate' => $previousCompletion,
            'completion_rate_delta' => round($currentCompletion - $previousCompletion, 1),
        ];
    }

    private function median(Collection $scores): float
    {
        $count = $scores->count();

        if ($count === 0) {
            return 0.0;
        }

        $middle = intdiv($count, 2);
        $median = $count % 2 === 1
            ? $scores->values()[$middle]
            : (($scores->values()[$middle - 1] + $scores->values()[$middle]) / 2);

        return round((float) $median, 1);
    }

    private function statusLabel(string $status): string
    {
        return str($status)->replace('_', ' ')->title()->toString();
    }

    private function statusSort(string $status): int
    {
        $index = array_search($status, [
            'draft',
            'goal_setting',
            'self_assessment_pending',
            'self_assessment_submitted',
            'manager_review_pending',
            'manager_review_completed',
            'approval_pending',
            'approved',
            'calibration_pending',
            'sent_back',
            'finalized',
        ], true);

        return $index === false ? 99 : $index;
    }

    private function riskLevel(float $completionRate, float $overdueRate): string
    {
        if ($overdueRate >= 30 || $completionRate < 40) {
            return 'High';
        }

        if ($overdueRate > 0 || $completionRate < 75) {
            return 'Medium';
        }

        return 'Low';
    }

    private function overdueSeverity(Builder $query): Collection
    {
        $buckets = collect([
            '1-3 days' => ['bucket' => '1-3 days', 'total' => 0],
            '4-7 days' => ['bucket' => '4-7 days', 'total' => 0],
            '8+ days' => ['bucket' => '8+ days', 'total' => 0],
        ]);

        $items = $this->overdueVisibleAppraisals($query);

        foreach ($items as $item) {
            $days = $item['days_overdue'];
            $key = $days <= 3 ? '1-3 days' : ($days <= 7 ? '4-7 days' : '8+ days');
            $bucket = $buckets->get($key);
            $bucket['total']++;
            $buckets->put($key, $bucket);
        }

        $oldest = $items->sortByDesc('days_overdue')->first();

        return $buckets
            ->values()
            ->map(fn (array $bucket) => [
                ...$bucket,
                'average_days_overdue' => $items->isNotEmpty() ? round($items->avg('days_overdue'), 1) : 0.0,
                'oldest_days_overdue' => (int) ($oldest['days_overdue'] ?? 0),
            ]);
    }

    private function cycleHealth(Builder $query): array
    {
        $cycle = $this->focusCycle();

        if (! $cycle) {
            return [
                'score' => 0,
                'status' => 'inactive',
                'completion_rate' => 0.0,
                'overdue_rate' => 0.0,
                'pending_approvals' => 0,
                'days_until_close' => null,
            ];
        }

        $cycleQuery = (clone $query)->where('review_cycle_id', $cycle['id']);
        $total = (clone $cycleQuery)->count();
        $overdue = $this->overdueVisibleAppraisals($cycleQuery)->count();
        $overdueRate = $total > 0 ? round(($overdue / $total) * 100, 1) : 0.0;
        $daysUntilClose = $cycle['end_date'] ? now()->startOfDay()->diffInDays($cycle['end_date'], false) : null;
        $completionRate = (float) $cycle['completion_rate'];
        $pendingApprovals = (int) $cycle['approval_pending_count'];
        $score = max(0, min(100, round(100 - $overdueRate - ((100 - $completionRate) * 0.3) - min(25, $pendingApprovals * 5) + ($daysUntilClose !== null && $daysUntilClose < 7 ? -10 : 0))));

        return [
            'score' => $score,
            'status' => $score >= 75 ? 'green' : ($score >= 30 ? 'amber' : 'red'),
            'completion_rate' => $completionRate,
            'overdue_rate' => $overdueRate,
            'pending_approvals' => $pendingApprovals,
            'days_until_close' => $daysUntilClose,
        ];
    }

    private function managerWorkload(Builder $query): Collection
    {
        $overdueByManager = $this->overdueVisibleAppraisals($query)
            ->groupBy('line_manager_user_id')
            ->map->count();
        $turnaroundByManager = (clone $query)
            ->whereNotNull('appraisals.line_manager_user_id')
            ->whereNotNull('appraisals.self_assessment_submitted_at')
            ->whereNotNull('appraisals.manager_reviewed_at')
            ->get([
                'appraisals.line_manager_user_id',
                'appraisals.self_assessment_submitted_at',
                'appraisals.manager_reviewed_at',
            ])
            ->groupBy('line_manager_user_id')
            ->map(fn (Collection $rows) => round($rows->avg(
                fn (Appraisal $appraisal) => $appraisal->self_assessment_submitted_at->diffInDays($appraisal->manager_reviewed_at)
            ), 1));

        return (clone $query)
            ->leftJoin('users as managers', 'managers.id', '=', 'appraisals.line_manager_user_id')
            ->whereNotNull('appraisals.line_manager_user_id')
            ->selectRaw("
                appraisals.line_manager_user_id,
                managers.name as manager,
                sum(case when appraisals.status = 'manager_review_pending' then 1 else 0 end) as pending_reviews
            ")
            ->groupBy('appraisals.line_manager_user_id', 'managers.name')
            ->orderByDesc('pending_reviews')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'manager' => $row->manager ?? 'Unassigned',
                'pending_reviews' => (int) $row->pending_reviews,
                'average_turnaround_days' => (float) ($turnaroundByManager->get($row->line_manager_user_id) ?? 0),
                'overdue_reviews' => (int) ($overdueByManager->get($row->line_manager_user_id) ?? 0),
            ]);
    }

    private function departmentRisk(Builder $query): Collection
    {
        $cycle = $this->focusCycle();
        $cycleQuery = $cycle
            ? (clone $query)->where('review_cycle_id', $cycle['id'])
            : clone $query;

        $overdueByDepartment = $this->overdueVisibleAppraisals($cycleQuery)
            ->groupBy('department_name_snapshot')
            ->map->count();

        return (clone $cycleQuery)
            ->whereNotNull('department_name_snapshot')
            ->selectRaw('
                department_name_snapshot as department,
                count(*) as total,
                sum(case when status = "finalized" then 1 else 0 end) as finalized,
                avg('.self::EFFECTIVE_OVERALL_SCORE_SQL.') as average_score
            ')
            ->groupBy('department_name_snapshot')
            ->get()
            ->map(function ($row) use ($overdueByDepartment) {
                $total = (int) $row->total;
                $completionRate = $total > 0 ? round(((int) $row->finalized / $total) * 100, 1) : 0.0;
                $overdueRate = $total > 0 ? round(((int) ($overdueByDepartment->get($row->department) ?? 0) / $total) * 100, 1) : 0.0;
                $averageScore = round((float) ($row->average_score ?? 0), 1);

                return [
                    'department' => $row->department,
                    'total' => $total,
                    'completion_rate' => $completionRate,
                    'overdue_rate' => $overdueRate,
                    'average_score' => $averageScore,
                    'risk_score' => round((100 - $completionRate) + $overdueRate + max(0, 70 - $averageScore), 1),
                ];
            })
            ->sortByDesc('risk_score')
            ->take(8)
            ->values();
    }

    private function scoreQuality(Builder $query): array
    {
        $cycle = $this->focusCycle();
        $qualityQuery = $cycle
            ? (clone $query)->where('review_cycle_id', $cycle['id'])
            : clone $query;

        $scores = (clone $qualityQuery)
            ->where('status', 'finalized')
            ->whereRaw(self::EFFECTIVE_OVERALL_SCORE_SQL.' is not null')
            ->orderByRaw(self::EFFECTIVE_OVERALL_SCORE_SQL)
            ->selectRaw(self::EFFECTIVE_OVERALL_SCORE_SQL.' as effective_overall_score')
            ->pluck('effective_overall_score')
            ->map(fn ($score) => (float) $score)
            ->values();

        $count = $scores->count();
        $median = 0.0;

        if ($count > 0) {
            $middle = intdiv($count, 2);
            $median = $count % 2 === 1
                ? $scores[$middle]
                : (($scores[$middle - 1] + $scores[$middle]) / 2);
        }

        $businessAverage = (clone $qualityQuery)->where('status', 'finalized')->whereNotNull('business_score')->avg('business_score');
        $valuesAverage = (clone $qualityQuery)->where('status', 'finalized')->whereNotNull('values_score')->avg('values_score');

        return [
            'average_score' => round((float) ($scores->avg() ?? 0), 1),
            'median_score' => round((float) $median, 1),
            'score_spread' => $scores->isNotEmpty() ? round($scores->max() - $scores->min(), 1) : 0.0,
            'business_values_gap' => $businessAverage !== null && $valuesAverage !== null ? round(abs((float) $businessAverage - (float) $valuesAverage), 1) : 0.0,
            'unrated_finalized_reviews' => (clone $qualityQuery)->where('status', 'finalized')->whereRaw(self::EFFECTIVE_OVERALL_SCORE_SQL.' is null')->count(),
        ];
    }

    private function rework(Builder $query): array
    {
        $cycle = $this->focusCycle();
        $cycleQuery = $cycle
            ? (clone $query)->where('review_cycle_id', $cycle['id'])
            : clone $query;
        $total = (clone $cycleQuery)->count();
        $sentBack = (clone $cycleQuery)->where('status', 'sent_back')->count();

        return [
            'sent_back_count' => $sentBack,
            'sent_back_rate' => $total > 0 ? round(($sentBack / $total) * 100, 1) : 0.0,
        ];
    }

    private function coverage(Builder $query): array
    {
        $cycle = $this->focusCycle();
        $eligible = EmployeeProfile::query()
            ->where('is_active', true)
            ->where('is_review_eligible', true)
            ->count();
        $assigned = $cycle
            ? (clone $query)->where('review_cycle_id', $cycle['id'])->distinct('employee_profile_id')->count('employee_profile_id')
            : 0;

        return [
            'eligible_employees' => $eligible,
            'assigned_employees' => $assigned,
            'unassigned_employees' => max(0, $eligible - $assigned),
            'coverage_rate' => $eligible > 0 ? round(($assigned / $eligible) * 100, 1) : 0.0,
        ];
    }

    private function trendDeltas(Builder $query): array
    {
        $cycles = ReviewCycle::query()
            ->orderByDesc('end_date')
            ->limit(2)
            ->pluck('id')
            ->values();

        $currentCycleId = $this->focusCycle()['id'] ?? $cycles->get(0);
        $previousCycleId = $cycles->first(fn ($id) => $id !== $currentCycleId);

        $current = $this->cycleSnapshot(clone $query, $currentCycleId);
        $previous = $previousCycleId ? $this->cycleSnapshot(clone $query, $previousCycleId) : ['completion_rate' => 0.0, 'average_score' => 0.0, 'overdue_reviews' => 0, 'finalized_reviews' => 0];

        return [
            'completion_rate_delta' => round($current['completion_rate'] - $previous['completion_rate'], 1),
            'average_score_delta' => round($current['average_score'] - $previous['average_score'], 1),
            'overdue_reviews_delta' => $current['overdue_reviews'] - $previous['overdue_reviews'],
            'finalized_reviews_delta' => $current['finalized_reviews'] - $previous['finalized_reviews'],
        ];
    }

    private function actionSummary(User $user): array
    {
        return [
            'my_self_assessments_due' => Appraisal::query()
                ->where('employee_user_id', $user->id)
                ->where('status', 'self_assessment_pending')
                ->count(),
            'manager_reviews_due' => Appraisal::query()
                ->where('line_manager_user_id', $user->id)
                ->where('status', 'manager_review_pending')
                ->count(),
            'approvals_due' => Appraisal::query()
                ->where('approving_manager_user_id', $user->id)
                ->where('status', 'approval_pending')
                ->count(),
            'overdue_assigned_to_me' => $this->overdueReviews()
                ->filter(fn ($appraisal) => in_array($user->id, [
                    $appraisal->employee_user_id,
                    $appraisal->line_manager_user_id,
                    $appraisal->approving_manager_user_id,
                ], true))
                ->count(),
        ];
    }

    private function overdueVisibleAppraisals(Builder $query): Collection
    {
        return (clone $query)
            ->with('reviewCycle')
            ->where(function (Builder $query) {
                $query->where(function (Builder $self) {
                    $self->where('appraisals.status', 'self_assessment_pending')
                        ->whereHas('reviewCycle', fn (Builder $cycle) => $cycle->whereDate('self_assessment_deadline', '<', now()->toDateString()));
                })->orWhere(function (Builder $manager) {
                    $manager->where('appraisals.status', 'manager_review_pending')
                        ->whereHas('reviewCycle', fn (Builder $cycle) => $cycle->whereDate('manager_review_deadline', '<', now()->toDateString()));
                })->orWhere(function (Builder $approval) {
                    $approval->where('appraisals.status', 'approval_pending')
                        ->whereHas('reviewCycle', fn (Builder $cycle) => $cycle->whereDate('approval_deadline', '<', now()->toDateString()));
                });
            })
            ->get([
                'appraisals.id',
                'appraisals.review_cycle_id',
                'appraisals.status',
                'appraisals.line_manager_user_id',
                'appraisals.department_name_snapshot',
            ])
            ->map(function (Appraisal $appraisal) {
                $deadline = match ((string) $appraisal->status->value) {
                    'self_assessment_pending' => $appraisal->reviewCycle?->self_assessment_deadline,
                    'manager_review_pending' => $appraisal->reviewCycle?->manager_review_deadline,
                    'approval_pending' => $appraisal->reviewCycle?->approval_deadline,
                    default => null,
                };

                return [
                    'id' => $appraisal->id,
                    'line_manager_user_id' => $appraisal->line_manager_user_id,
                    'department_name_snapshot' => $appraisal->department_name_snapshot,
                    'days_overdue' => $deadline ? (int) $deadline->diffInDays(now()->startOfDay()) : 0,
                ];
            });
    }

    private function cycleSnapshot(Builder $query, ?int $cycleId): array
    {
        if (! $cycleId) {
            return ['completion_rate' => 0.0, 'average_score' => 0.0, 'overdue_reviews' => 0, 'finalized_reviews' => 0];
        }

        $cycleQuery = (clone $query)->where('review_cycle_id', $cycleId);
        $total = (clone $cycleQuery)->count();
        $finalized = (clone $cycleQuery)->where('status', 'finalized')->count();

        return [
            'completion_rate' => $total > 0 ? round(($finalized / $total) * 100, 1) : 0.0,
            'average_score' => round((float) ((clone $cycleQuery)->where('status', 'finalized')->selectRaw('avg('.self::EFFECTIVE_OVERALL_SCORE_SQL.') as average_score')->value('average_score') ?? 0), 1),
            'overdue_reviews' => $this->overdueVisibleAppraisals($cycleQuery)->count(),
            'finalized_reviews' => $finalized,
        ];
    }

    private function effectiveOverallScore(Appraisal $appraisal): ?float
    {
        $score = $appraisal->calibrated_overall_score ?? $appraisal->overall_score;

        return $score !== null ? (float) $score : null;
    }

    private function normalizeFilters(array|int|null $filters = null): array
    {
        if (is_array($filters)) {
            return $filters;
        }

        return [
            'review_cycle_id' => $filters,
        ];
    }
}
