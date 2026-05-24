<?php

namespace App\Services\Performance;

use App\Models\Appraisal;
use App\Models\GoalLibraryItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class GoalLibraryLookupService
{
    public function queryForAppraisal(Appraisal $appraisal): Builder
    {
        $appraisal->loadMissing('employeeProfile');

        return $this->queryForProfile(
            $appraisal->employeeProfile?->department_id,
            $appraisal->employeeProfile?->job_title_id,
        );
    }

    public function queryForUser(User $user): Builder
    {
        $user->loadMissing('employeeProfile');

        return $this->queryForProfile(
            $user->employeeProfile?->department_id,
            $user->employeeProfile?->job_title_id,
        );
    }

    public function queryForProfile(?int $departmentId, ?int $jobTitleId, bool $activeOnly = true): Builder
    {
        if (! $departmentId) {
            return GoalLibraryItem::query()->whereRaw('0 = 1');
        }

        return $this->applyProfileScope(
            GoalLibraryItem::query(),
            $departmentId,
            $jobTitleId,
            $activeOnly,
        );
    }

    public function applyProfileScope(
        Builder $query,
        int $departmentId,
        ?int $jobTitleId,
        bool $activeOnly = true,
        bool $requireJobTitleMatch = false,
    ): Builder {
        if ($activeOnly) {
            $query->where('is_active', true);
        }

        if ($requireJobTitleMatch) {
            if (! $jobTitleId) {
                return $query->whereRaw('0 = 1');
            }

            return $query
                ->where('department_id', $departmentId)
                ->where('job_title_id', $jobTitleId);
        }

        return $query
            ->where('department_id', $departmentId)
            ->where(function (Builder $scoped) use ($jobTitleId) {
                $scoped->whereNull('job_title_id');

                if ($jobTitleId) {
                    $scoped->orWhere('job_title_id', $jobTitleId);
                }
            });
    }

    public function matchesProfile(
        int $departmentId,
        ?int $jobTitleId,
        GoalLibraryItem $item,
        bool $requireJobTitleMatch = false,
    ): bool {
        if ((int) $item->department_id !== $departmentId) {
            return false;
        }

        if ($requireJobTitleMatch) {
            return $jobTitleId !== null && (int) $item->job_title_id === $jobTitleId;
        }

        if ($item->job_title_id === null) {
            return true;
        }

        return $jobTitleId !== null && (int) $item->job_title_id === $jobTitleId;
    }

    public function applySearch(Builder $query, string $search): Builder
    {
        $term = trim($search);

        if ($term === '') {
            return $query;
        }

        $like = "%{$term}%";

        return $query->where(function (Builder $sub) use ($like) {
            $sub->where('title', 'like', $like)
                ->orWhere('description', 'like', $like)
                ->orWhere('kpi_measure', 'like', $like)
                ->orWhere('target_definition', 'like', $like)
                ->orWhere('evidence_source', 'like', $like)
                ->orWhereHas('perspective', fn (Builder $perspective) => $perspective->where('name', 'like', $like))
                ->orWhereHas('jobTitle', fn (Builder $jobTitle) => $jobTitle->where('name', 'like', $like));
        });
    }

    public function searchForAppraisal(
        Appraisal $appraisal,
        string $search = '',
        int $limit = 25,
        array $excludeIds = [],
    ): array {
        $query = $this->applySearch($this->queryForAppraisal($appraisal), $search);

        $excludeIds = array_values(array_unique(array_filter(
            array_map('intval', $excludeIds),
            fn (int $id) => $id > 0,
        )));

        if ($excludeIds !== []) {
            $query->whereNotIn('id', $excludeIds);
        }

        $items = $query
            ->with(['perspective:id,name', 'jobTitle:id,name'])
            ->orderBy('title')
            ->limit($limit)
            ->get();

        return $items->map(fn (GoalLibraryItem $item) => $this->formatLookupResult($item))->all();
    }

    private function formatLookupResult(GoalLibraryItem $item): array
    {
        return [
            'value' => $item->id,
            'label' => $item->title,
            'perspective_id' => $item->perspective_id,
            'perspective_name' => $item->perspective?->name,
            'job_title_name' => $item->jobTitle?->name,
            'title' => $item->title,
            'description' => $item->description,
            'kpi_measure' => $item->kpi_measure,
            'target_definition' => $item->target_definition,
            'default_weight' => $item->default_weight !== null ? (float) $item->default_weight : null,
            'evidence_source' => $item->evidence_source,
        ];
    }
}
