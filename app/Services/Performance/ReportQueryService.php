<?php

namespace App\Services\Performance;

use App\Models\Appraisal;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class ReportQueryService
{
    private const DASHBOARD_CACHE_TTL_SECONDS = 300;

    public function dashboard(User $user): array
    {
        return Cache::remember(
            "performance:dashboard:user:{$user->id}",
            self::DASHBOARD_CACHE_TTL_SECONDS,
            fn () => $this->buildDashboard($user),
        );
    }

    private function buildDashboard(User $user): array
    {
        $ownQuery = $this->ownAppraisals($user);
        $teamQuery = $this->teamAppraisals($user);
        $approvalQuery = $this->approvalAppraisals($user);
        $visibleQuery = $this->dashboardVisibleAppraisals($user);

        return [
            'metrics' => [
                'my_open_appraisals' => (clone $ownQuery)->whereNotIn('status', ['approved', 'finalized'])->count(),
                'team_pending_reviews' => (clone $teamQuery)->where('status', 'manager_review_pending')->count(),
                'pending_approvals' => (clone $approvalQuery)->where('status', 'approval_pending')->count(),
                'overdue_reviews' => $this->overdueReviews()->count(),
                'open_cycles' => ReviewCycle::query()->where('status', 'open')->count(),
                'finalized_reviews' => Appraisal::query()->whereNotNull('finalized_at')->count(),
            ],
            'focus_cycle' => $this->focusCycle(),
            'workflow_distribution' => $this->workflowDistribution($visibleQuery),
            'rating_distribution' => $this->dashboardRatingDistribution($visibleQuery),
            'cycle_performance' => $this->cyclePerformance($visibleQuery),
            'department_performance' => $this->departmentPerformance($visibleQuery),
            'deadline_pressure' => $this->deadlinePressure($visibleQuery),
        ];
    }

    public function cycleSummary(array|int|null $filters = null): Collection
    {
        return $this->baseReportQuery($this->normalizeFilters($filters))
            ->selectRaw('cycle_name_snapshot as cycle, count(*) as total, avg(overall_score) as average_score')
            ->groupBy('cycle_name_snapshot')
            ->get();
    }

    public function departmentSummary(array|int|null $filters = null): Collection
    {
        return $this->baseReportQuery($this->normalizeFilters($filters))
            ->selectRaw('department_name_snapshot as department, count(*) as total, avg(overall_score) as average_score')
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
                'overall_score',
            ])
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
            ->leftJoin('rating_scale_levels', 'rating_scale_levels.id', '=', 'appraisals.overall_rating_scale_level_id')
            ->selectRaw('coalesce(rating_scale_levels.label, "Unrated") as rating, count(*) as total')
            ->groupBy('rating_scale_levels.label')
            ->get();
    }

    public function overdueReviews(array|int|null $filters = null): Collection
    {
        return $this->baseReportQuery($this->normalizeFilters($filters))
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
                    when 'sent_back' then 9
                    when 'finalized' then 10
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
            ->leftJoin('rating_scale_levels', 'rating_scale_levels.id', '=', 'appraisals.overall_rating_scale_level_id')
            ->selectRaw('coalesce(rating_scale_levels.label, "Unrated") as rating, count(*) as total')
            ->groupBy('rating_scale_levels.label')
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
                avg(appraisals.overall_score) as average_score,
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
            ->whereNotNull('overall_score')
            ->selectRaw('
                department_name_snapshot as department,
                count(*) as total,
                avg(overall_score) as average_score
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
