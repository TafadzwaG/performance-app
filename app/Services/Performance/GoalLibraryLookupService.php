<?php

namespace App\Services\Performance;

use App\Models\Appraisal;
use App\Models\GoalLibraryItem;
use Illuminate\Database\Eloquent\Builder;

class GoalLibraryLookupService
{
    public function queryForAppraisal(Appraisal $appraisal): Builder
    {
        $appraisal->loadMissing('employeeProfile');

        $departmentId = $appraisal->employeeProfile?->department_id;
        $jobTitleId = $appraisal->employeeProfile?->job_title_id;

        if (! $departmentId) {
            return GoalLibraryItem::query()->whereRaw('0 = 1');
        }

        return GoalLibraryItem::query()
            ->where('is_active', true)
            ->where('department_id', $departmentId)
            ->where(function (Builder $query) use ($jobTitleId) {
                $query->whereNull('job_title_id');

                if ($jobTitleId) {
                    $query->orWhere('job_title_id', $jobTitleId);
                }
            });
    }

    public function searchForAppraisal(Appraisal $appraisal, string $search = '', int $limit = 25): array
    {
        $q = trim($search);

        $items = $this->queryForAppraisal($appraisal)
            ->with(['perspective:id,name', 'jobTitle:id,name'])
            ->when($q !== '', function (Builder $query) use ($q) {
                $like = "%{$q}%";

                $query->where(function (Builder $sub) use ($like) {
                    $sub->where('title', 'like', $like)
                        ->orWhere('description', 'like', $like)
                        ->orWhere('kpi_measure', 'like', $like)
                        ->orWhere('target_definition', 'like', $like)
                        ->orWhere('evidence_source', 'like', $like)
                        ->orWhereHas('perspective', fn (Builder $perspective) => $perspective->where('name', 'like', $like))
                        ->orWhereHas('jobTitle', fn (Builder $jobTitle) => $jobTitle->where('name', 'like', $like));
                });
            })
            ->orderBy('title')
            ->limit($limit)
            ->get();

        return $items->map(fn (GoalLibraryItem $item) => [
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
        ])->all();
    }
}
