<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\User;

class DashboardGoalsViewService
{
    /**
     * @return list<array{value: int, label: string, cycle_name: string, status: string, review_period: ?string, objectives_count: int, is_current: bool, is_completed: bool}>
     */
    public function lookup(User $user, string $search = '', int $limit = 20): array
    {
        $profile = $user->employeeProfile;

        if (! $profile) {
            return [];
        }

        $currentAppraisalId = $this->currentAppraisalIdFor($user);

        return $profile->appraisals()
            ->with('reviewCycle')
            ->withCount('objectives')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($scoped) use ($search) {
                    $scoped->where('cycle_name_snapshot', 'like', "%{$search}%")
                        ->orWhereHas('reviewCycle', function ($cycle) use ($search) {
                            $cycle->where('name', 'like', "%{$search}%")
                                ->orWhere('code', 'like', "%{$search}%");
                        });
                });
            })
            ->get()
            ->sort(function (Appraisal $first, Appraisal $second) use ($currentAppraisalId) {
                $firstIsCurrent = $first->id === $currentAppraisalId ? 0 : 1;
                $secondIsCurrent = $second->id === $currentAppraisalId ? 0 : 1;

                if ($firstIsCurrent !== $secondIsCurrent) {
                    return $firstIsCurrent <=> $secondIsCurrent;
                }

                $firstEnd = $first->reviewCycle?->end_date?->getTimestamp() ?? 0;
                $secondEnd = $second->reviewCycle?->end_date?->getTimestamp() ?? 0;

                if ($firstEnd !== $secondEnd) {
                    return $secondEnd <=> $firstEnd;
                }

                return $second->updated_at <=> $first->updated_at;
            })
            ->take($limit)
            ->map(fn (Appraisal $appraisal) => $this->mapAppraisalToGoalCycleOption($appraisal, $currentAppraisalId))
            ->values()
            ->all();
    }

    public function assignedGoalCycles(User $user, int $limit = 50): array
    {
        return $this->lookup($user, limit: $limit);
    }

    public function payloadFor(Appraisal $appraisal): array
    {
        $appraisal->loadMissing([
            'reviewCycle',
            'objectives.perspective',
            'objectives.selfRatingLevel',
            'objectives.managerRatingLevel',
            'comments.author',
            'template.objectiveRatingScale.levels',
            'template.competencyRatingScale.levels',
            'employeeProfile.department',
            'employeeProfile.jobTitle',
            'overallRatingLevel',
            'calibratedOverallRatingLevel',
        ]);

        $cycle = $appraisal->reviewCycle;

        return [
            'appraisal_id' => $appraisal->id,
            'status' => $appraisal->status?->value ?? $appraisal->status,
            'is_current' => false,
            'employee' => [
                'name' => $appraisal->employee_name_snapshot,
                'email' => $appraisal->employee_email_snapshot,
                'employee_number' => $appraisal->employee_number_snapshot,
                'department' => $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? null),
                'job_title' => $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? null),
            ],
            'review_cycle' => [
                'id' => $cycle?->id,
                'name' => $cycle?->name ?? $appraisal->cycle_name_snapshot,
                'code' => $cycle?->code,
                'start_date' => $cycle?->start_date?->toDateString(),
                'end_date' => $cycle?->end_date?->toDateString(),
            ],
            'review_period' => $cycle && $cycle->start_date && $cycle->end_date
                ? $cycle->start_date->format('d M Y').' - '.$cycle->end_date->format('d M Y')
                : null,
            'objectives' => $appraisal->objectives->map(fn ($objective) => [
                'id' => $objective->id,
                'perspective' => $objective->perspective?->name,
                'title' => $objective->title,
                'kpi_measure' => $objective->kpi_measure,
                'target_definition' => $objective->target_definition,
                'weight' => $objective->weight !== null ? (float) $objective->weight : null,
                'evidence_source' => $objective->evidence_source,
                'performance_achieved' => $objective->performance_achieved,
                'self_rating' => $objective->selfRatingLevel?->label ?? $objective->self_rating_score,
                'manager_rating' => $objective->managerRatingLevel?->label ?? $objective->manager_rating_score,
            ])->values(),
            'comments' => $appraisal->comments->map(fn ($comment) => [
                'id' => $comment->id,
                'type' => (string) ($comment->comment_type?->value ?? $comment->comment_type),
                'body' => $comment->body,
                'author' => $comment->author?->name,
            ])->values(),
            'rating_scales' => [
                'business' => $this->ratingScalePayload($appraisal->template?->objectiveRatingScale),
                'values' => $this->ratingScalePayload($appraisal->template?->competencyRatingScale),
            ],
            'score_summary' => $this->scoreSummaryPayload($appraisal),
        ];
    }

    /**
     * @return array{
     *     business_score: float|null,
     *     values_score: float|null,
     *     overall_score: float|null,
     *     overall_rating: string
     * }
     */
    private function scoreSummaryPayload(Appraisal $appraisal): array
    {
        $overallScore = $appraisal->calibrated_overall_score ?? $appraisal->overall_score;

        return [
            'business_score' => $appraisal->business_score !== null ? (float) $appraisal->business_score : null,
            'values_score' => $appraisal->values_score !== null ? (float) $appraisal->values_score : null,
            'overall_score' => $overallScore !== null ? (float) $overallScore : null,
            'overall_rating' => $appraisal->calibratedOverallRatingLevel?->label
                ?? $appraisal->overallRatingLevel?->label
                ?? 'Pending',
        ];
    }

    public function latestScoreSummaryFor(User $user): ?array
    {
        $profile = $user->employeeProfile;

        if (! $profile) {
            return null;
        }

        $appraisal = $profile->appraisals()
            ->with(['overallRatingLevel', 'calibratedOverallRatingLevel', 'reviewCycle'])
            ->where('status', AppraisalStatus::Finalized->value)
            ->latest('finalized_at')
            ->first();

        if (! $appraisal instanceof Appraisal) {
            $appraisal = $profile->appraisals()
                ->with(['overallRatingLevel', 'calibratedOverallRatingLevel', 'reviewCycle'])
                ->where(function ($query) {
                    $query->whereNotNull('overall_score')
                        ->orWhereNotNull('calibrated_overall_score')
                        ->orWhereNotNull('business_score')
                        ->orWhereNotNull('values_score');
                })
                ->latest('updated_at')
                ->first();
        }

        if (! $appraisal instanceof Appraisal) {
            return null;
        }

        return [
            ...$this->scoreSummaryPayload($appraisal),
            'appraisal_id' => $appraisal->id,
            'cycle_name' => $appraisal->reviewCycle?->name ?? $appraisal->cycle_name_snapshot,
            'status' => $appraisal->status?->value ?? (string) $appraisal->status,
        ];
    }

    public function currentGoalsFor(User $user): ?array
    {
        $appraisal = $this->currentAppraisalQuery($user)->first();

        if (! $appraisal instanceof Appraisal) {
            return null;
        }

        $payload = $this->payloadFor($appraisal);
        $payload['is_current'] = true;

        return $payload;
    }

    public function userOwnsAppraisal(User $user, Appraisal $appraisal): bool
    {
        return $appraisal->employee_user_id === $user->id;
    }

    private function currentAppraisalIdFor(User $user): ?int
    {
        return $this->currentAppraisalQuery($user)->value('id');
    }

    private function currentAppraisalQuery(User $user)
    {
        return $user->employeeProfile?->appraisals()
            ->where('status', '!=', AppraisalStatus::Finalized->value)
            ->whereHas('reviewCycle', fn ($query) => $query->where('status', ReviewCycleStatus::Open->value))
            ->latest('updated_at');
    }

    private function lookupLabel(Appraisal $appraisal): string
    {
        $cycleName = $appraisal->reviewCycle?->name ?? $appraisal->cycle_name_snapshot ?? 'Review cycle';
        $status = str($appraisal->status?->value ?? $appraisal->status)->replace('_', ' ')->title()->toString();

        return "{$cycleName} ({$status})";
    }

    /**
     * @return array{value: int, label: string, cycle_name: string, status: string, review_period: ?string, objectives_count: int, is_current: bool, is_completed: bool}
     */
    private function mapAppraisalToGoalCycleOption(Appraisal $appraisal, ?int $currentAppraisalId): array
    {
        $cycle = $appraisal->reviewCycle;

        return [
            'value' => $appraisal->id,
            'label' => $this->lookupLabel($appraisal),
            'cycle_name' => $cycle?->name ?? $appraisal->cycle_name_snapshot ?? 'Review cycle',
            'status' => $appraisal->status?->value ?? (string) $appraisal->status,
            'review_period' => $cycle && $cycle->start_date && $cycle->end_date
                ? $cycle->start_date->format('d M Y').' - '.$cycle->end_date->format('d M Y')
                : null,
            'objectives_count' => (int) ($appraisal->objectives_count ?? 0),
            'is_current' => $appraisal->id === $currentAppraisalId,
            'is_completed' => $this->isCompletedGoalCycle($appraisal),
        ];
    }

    private function isCompletedGoalCycle(Appraisal $appraisal): bool
    {
        if ($appraisal->status === AppraisalStatus::Finalized) {
            return true;
        }

        return $appraisal->reviewCycle?->status === ReviewCycleStatus::Closed;
    }

    private function ratingScalePayload($ratingScale): ?array
    {
        if (! $ratingScale) {
            return null;
        }

        return [
            'name' => $ratingScale->name,
            'levels' => $ratingScale->levels->map(fn ($level) => [
                'id' => $level->id,
                'label' => $level->label,
                'description' => $level->description,
                'short_label' => $level->short_label,
                'value' => $level->value !== null ? (float) $level->value : null,
                'min_percent' => $level->min_percent !== null ? (float) $level->min_percent : null,
                'max_percent' => $level->max_percent !== null ? (float) $level->max_percent : null,
            ])->values(),
        ];
    }
}
