<?php

namespace App\Services\Performance;

use App\Models\Appraisal;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ReportQueryService
{
    public function dashboard(User $user): array
    {
        $ownQuery = Appraisal::query()->where('employee_user_id', $user->id);
        $teamQuery = Appraisal::query()->where('line_manager_user_id', $user->id);
        $approvalQuery = Appraisal::query()->where('approving_manager_user_id', $user->id);

        return [
            'my_open_appraisals' => (clone $ownQuery)->whereNotIn('status', ['approved', 'finalized'])->count(),
            'team_pending_reviews' => (clone $teamQuery)->where('status', 'manager_review_pending')->count(),
            'pending_approvals' => (clone $approvalQuery)->where('status', 'approval_pending')->count(),
            'overdue_reviews' => $this->overdueReviews()->count(),
            'open_cycles' => ReviewCycle::query()->where('status', 'open')->count(),
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
