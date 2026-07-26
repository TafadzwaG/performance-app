<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\ApprovalAction;
use App\Enums\ApprovalStage;
use App\Enums\ReviewCycleStatus;
use App\Events\Performance\AppraisalStatusChanged;
use App\Models\Appraisal;
use App\Models\AppraisalApproval;
use App\Models\AppraisalObjective;
use App\Models\AppraisalStatusHistory;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\OrganizationMembership;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewCycleAutomationService
{
    public function __construct(
        private readonly AppraisalTemplateInstantiationService $instantiationService,
        private readonly TenantContext $tenantContext,
    ) {}

    /**
     * @return array{ready:bool,eligible:int,excluded:int,existing:int,to_create:int,to_prepare:int,objective_count:int,template:array{name:string,min_objectives:int,max_objectives:int}|null,blockers:list<array<string,mixed>>}
     */
    public function readiness(ReviewCycle $cycle, ?bool $onlyMissing = null): array
    {
        return $this->analyze($cycle, $onlyMissing ?? $cycle->status === ReviewCycleStatus::Open)['readiness'];
    }

    public function open(ReviewCycle $cycle, User $actor): ReviewCycle
    {
        $processed = collect();

        $opened = DB::transaction(function () use ($cycle, $actor, &$processed): ReviewCycle {
            $lockedCycle = ReviewCycle::query()->lockForUpdate()->findOrFail($cycle->id);

            if ($lockedCycle->status === ReviewCycleStatus::Open) {
                return $lockedCycle;
            }

            if ($lockedCycle->status !== ReviewCycleStatus::Draft) {
                throw ValidationException::withMessages([
                    'automation' => 'Only a draft review cycle can be opened.',
                ]);
            }

            $analysis = $this->analyze($lockedCycle, false);
            $this->assertReady($analysis['readiness']);

            foreach ($analysis['plans'] as $plan) {
                $appraisal = $this->prepareAppraisal($lockedCycle, $plan['profile'], $plan['kpis'], $actor);

                if ($appraisal !== null) {
                    $processed->push($appraisal->id);
                }
            }

            $lockedCycle->forceFill([
                'status' => ReviewCycleStatus::Open,
                'opened_at' => now(),
                'closed_at' => null,
            ])->save();

            return $lockedCycle->refresh();
        });

        $this->dispatchReadyEvents($processed, $actor);

        return $opened;
    }

    /** @return array{cycle:ReviewCycle,created:int} */
    public function sync(ReviewCycle $cycle, User $actor): array
    {
        $processed = collect();

        $syncedCycle = DB::transaction(function () use ($cycle, $actor, &$processed): ReviewCycle {
            $lockedCycle = ReviewCycle::query()->lockForUpdate()->findOrFail($cycle->id);

            if ($lockedCycle->status !== ReviewCycleStatus::Open) {
                throw ValidationException::withMessages([
                    'automation' => 'Eligible employees can only be synchronized into an open review cycle.',
                ]);
            }

            $analysis = $this->analyze($lockedCycle, true);
            $this->assertReady($analysis['readiness']);

            foreach ($analysis['plans'] as $plan) {
                $appraisal = $this->prepareAppraisal($lockedCycle, $plan['profile'], $plan['kpis'], $actor);

                if ($appraisal !== null) {
                    $processed->push($appraisal->id);
                }
            }

            return $lockedCycle;
        });

        $this->dispatchReadyEvents($processed, $actor);

        return ['cycle' => $syncedCycle, 'created' => $processed->count()];
    }

    /**
     * @return array{
     *   readiness:array{ready:bool,eligible:int,excluded:int,existing:int,to_create:int,to_prepare:int,objective_count:int,template:array{name:string,min_objectives:int,max_objectives:int}|null,blockers:list<array<string,mixed>>},
     *   plans:list<array{profile:EmployeeProfile,kpis:Collection<int,GoalLibraryItem>}>
     * }
     */
    private function analyze(ReviewCycle $cycle, bool $onlyMissing): array
    {
        $cycle->loadMissing('template');
        $organizationId = $this->tenantContext->requireId();
        $allProfiles = EmployeeProfile::query()->count();

        $eligibleProfiles = EmployeeProfile::query()
            ->with(['user:id,name,email', 'department:id,name', 'jobTitle:id,name'])
            ->where('is_active', true)
            ->where('is_review_eligible', true)
            ->where(function ($query) use ($cycle) {
                $query->whereNull('review_eligibility_date')
                    ->orWhereDate('review_eligibility_date', '<=', $cycle->start_date);
            })
            ->whereHas('user.memberships', fn ($query) => $query
                ->where('organization_id', $organizationId)
                ->where('status', 'active'))
            ->orderBy('employee_number')
            ->get();

        $activeMemberIds = OrganizationMembership::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->flip();

        $existingByProfile = Appraisal::query()
            ->where('review_cycle_id', $cycle->id)
            ->get()
            ->keyBy('employee_profile_id');

        $kpisByScope = GoalLibraryItem::query()
            ->with(['perspective:id,name'])
            ->where('is_active', true)
            ->orderBy('perspective_id')
            ->orderBy('title')
            ->get()
            ->groupBy(fn (GoalLibraryItem $item) => $this->scopeKey($item->department_id, $item->job_title_id));

        $blockers = collect();
        $plans = collect();
        $existing = 0;
        $toCreate = 0;
        $toPrepare = 0;
        $objectiveCount = 0;

        if (! $cycle->template_id || ! $cycle->template || ! $cycle->template->is_active) {
            $blockers->push($this->globalBlocker('Select an active appraisal template before opening or synchronizing this cycle.'));
        }

        if (! $onlyMissing && $eligibleProfiles->isEmpty()) {
            $blockers->push($this->globalBlocker('No active, review-eligible employees are available for this cycle.'));
        }

        foreach ($eligibleProfiles as $profile) {
            $existingAppraisal = $existingByProfile->get($profile->id);

            if ($existingAppraisal) {
                $existing++;

                if ($onlyMissing || $this->hasProgressed($existingAppraisal)) {
                    continue;
                }

                $toPrepare++;
            } else {
                $toCreate++;
            }

            $reasons = collect();

            if (! $profile->department_id) {
                $reasons->push('Department is missing.');
            }

            if (! $profile->job_title_id) {
                $reasons->push('Job title is missing.');
            }

            if (! $profile->line_manager_user_id) {
                $reasons->push('Line manager is missing.');
            } elseif (! $activeMemberIds->has((int) $profile->line_manager_user_id)) {
                $reasons->push('Line manager is not an active member of this organization.');
            }

            if (! $profile->approving_manager_user_id) {
                $reasons->push('Approving manager is missing.');
            } elseif (! $activeMemberIds->has((int) $profile->approving_manager_user_id)) {
                $reasons->push('Approving manager is not an active member of this organization.');
            }

            $kpis = ($profile->department_id && $profile->job_title_id)
                ? $kpisByScope->get($this->scopeKey($profile->department_id, $profile->job_title_id), collect())
                : collect();

            if ($kpis->isEmpty()) {
                $reasons->push('No active My KPIs match this department and job title.');
            } else {
                if ($kpis->contains(fn (GoalLibraryItem $item) => (float) $item->default_weight <= 0)) {
                    $reasons->push('Every matching KPI must have a weight greater than zero.');
                }

                if (round((float) $kpis->sum('default_weight'), 2) !== 100.0) {
                    $reasons->push('Matching KPI weights must total exactly 100%.');
                }

                if ($cycle->template) {
                    if ($kpis->count() < (int) $cycle->template->min_objectives) {
                        $reasons->push("At least {$cycle->template->min_objectives} KPIs are required by the selected template.");
                    }

                    if ($kpis->count() > (int) $cycle->template->max_objectives) {
                        $reasons->push("No more than {$cycle->template->max_objectives} KPIs are allowed by the selected template.");
                    }
                }
            }

            if ($reasons->isNotEmpty()) {
                $blockers->push(array_merge([
                    'employee_profile_id' => $profile->id,
                    'employee_number' => $profile->employee_number,
                    'employee_name' => $profile->user?->name ?? 'Unknown employee',
                    'department_id' => $profile->department_id,
                    'department_name' => $profile->department?->name,
                    'job_title_id' => $profile->job_title_id,
                    'job_title_name' => $profile->jobTitle?->name,
                    'reasons' => $reasons->values()->all(),
                ], $this->formatMatchingKpis($kpis)));

                continue;
            }

            $plans->push(['profile' => $profile, 'kpis' => $kpis]);
            $objectiveCount += $kpis->count();
        }

        return [
            'readiness' => [
                'ready' => $blockers->isEmpty(),
                'eligible' => $eligibleProfiles->count(),
                'excluded' => max(0, $allProfiles - $eligibleProfiles->count()),
                'existing' => $existing,
                'to_create' => $toCreate,
                'to_prepare' => $toPrepare,
                'objective_count' => $objectiveCount,
                'template' => $cycle->template ? [
                    'name' => $cycle->template->name,
                    'min_objectives' => (int) $cycle->template->min_objectives,
                    'max_objectives' => (int) $cycle->template->max_objectives,
                ] : null,
                'blockers' => $blockers->values()->all(),
            ],
            'plans' => $plans->values()->all(),
        ];
    }

    private function prepareAppraisal(ReviewCycle $cycle, EmployeeProfile $profile, Collection $kpis, User $actor): ?Appraisal
    {
        $appraisal = Appraisal::query()
            ->where('review_cycle_id', $cycle->id)
            ->where('employee_profile_id', $profile->id)
            ->first();

        if ($appraisal && $this->hasProgressed($appraisal)) {
            return null;
        }

        $previousStatus = $appraisal?->status ?? AppraisalStatus::Draft;
        $appraisal ??= new Appraisal;
        $template = $cycle->template;

        $appraisal->fill([
            'review_cycle_id' => $cycle->id,
            'employee_profile_id' => $profile->id,
            'template_id' => $template->id,
            'employee_user_id' => $profile->user_id,
            'line_manager_user_id' => $profile->line_manager_user_id,
            'approving_manager_user_id' => $profile->approving_manager_user_id,
            'status' => AppraisalStatus::SelfAssessmentPending,
            'reopened_stage' => null,
            'business_weight_percent' => $template->business_weight_percent,
            'values_weight_percent' => $template->values_weight_percent,
            'goal_submitted_at' => now(),
            'employee_name_snapshot' => $profile->user?->name ?? 'Unknown employee',
            'employee_email_snapshot' => $profile->user?->email ?? 'unknown@example.com',
            'employee_number_snapshot' => $profile->employee_number,
            'department_name_snapshot' => $profile->department?->name,
            'job_title_name_snapshot' => $profile->jobTitle?->name,
            'cycle_name_snapshot' => $cycle->name,
            'template_name_snapshot' => $template->name,
        ])->save();

        $appraisal->objectives()->delete();
        $appraisal->competencyRatings()->delete();

        foreach ($kpis->values() as $index => $kpi) {
            AppraisalObjective::query()->create([
                'appraisal_id' => $appraisal->id,
                'template_item_id' => null,
                'goal_library_item_id' => $kpi->id,
                'perspective_id' => $kpi->perspective_id,
                'objective_type' => 'business',
                'title' => $kpi->title,
                'kpi_measure' => $kpi->kpi_measure,
                'target_definition' => $kpi->target_definition,
                'weight' => $kpi->default_weight,
                'evidence_source' => $kpi->evidence_source,
                'due_date' => $this->objectiveDueDate($cycle, $kpi),
                'include_in_business_score' => true,
                'sort_order' => $index + 1,
            ]);
        }

        $this->instantiationService->createChildren($appraisal->fresh());

        $snapshot = [
            'source' => 'my_kpis',
            'automated' => true,
            'template_id' => $template->id,
            'goal_library_item_ids' => $kpis->pluck('id')->values()->all(),
        ];

        AppraisalApproval::query()->create([
            'appraisal_id' => $appraisal->id,
            'actor_user_id' => $actor->id,
            'stage' => ApprovalStage::GoalSetting,
            'action' => ApprovalAction::Submitted,
            'comments' => 'Goal plan automatically generated from My KPIs when the review cycle was opened or synchronized.',
            'snapshot' => $snapshot,
            'acted_at' => now(),
        ]);

        AppraisalStatusHistory::query()->create([
            'appraisal_id' => $appraisal->id,
            'actor_user_id' => $actor->id,
            'from_status' => $previousStatus,
            'to_status' => AppraisalStatus::SelfAssessmentPending,
            'reason' => 'Goals automatically generated from My KPIs; self assessment is ready.',
            'metadata' => $snapshot,
            'changed_at' => now(),
        ]);

        return $appraisal->refresh();
    }

    private function objectiveDueDate(ReviewCycle $cycle, GoalLibraryItem $kpi): string
    {
        if ($kpi->timeline_days === null) {
            return $cycle->end_date->toDateString();
        }

        $dueDate = $cycle->start_date->copy()->addDays((int) $kpi->timeline_days);

        return $dueDate->min($cycle->end_date)->toDateString();
    }

    private function hasProgressed(Appraisal $appraisal): bool
    {
        return $appraisal->goal_submitted_at !== null
            || $appraisal->self_assessment_submitted_at !== null
            || ! in_array($appraisal->status, [AppraisalStatus::Draft, AppraisalStatus::GoalSetting], true);
    }

    private function scopeKey(mixed $departmentId, mixed $jobTitleId): string
    {
        return (int) $departmentId.':'.(int) $jobTitleId;
    }

    private function globalBlocker(string $reason): array
    {
        return array_merge([
            'employee_profile_id' => null,
            'employee_number' => null,
            'employee_name' => 'Cycle configuration',
            'department_id' => null,
            'department_name' => null,
            'job_title_id' => null,
            'job_title_name' => null,
            'reasons' => [$reason],
        ], $this->formatMatchingKpis(collect()));
    }

    /**
     * @return array{matching_kpis:list<array<string,mixed>>,kpi_weight_total:float}
     */
    private function formatMatchingKpis(Collection $kpis): array
    {
        return [
            'matching_kpis' => $kpis
                ->map(fn (GoalLibraryItem $item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'default_weight' => (float) $item->default_weight,
                    'perspective_id' => $item->perspective_id,
                    'perspective_name' => $item->perspective?->name,
                    'kpi_measure' => $item->kpi_measure,
                ])
                ->values()
                ->all(),
            'kpi_weight_total' => round((float) $kpis->sum('default_weight'), 2),
        ];
    }

    private function assertReady(array $readiness): void
    {
        if ($readiness['ready']) {
            return;
        }

        $firstReason = collect($readiness['blockers'])->pluck('reasons')->flatten()->first();

        throw ValidationException::withMessages([
            'automation' => $firstReason ?: 'Resolve the automation readiness blockers before continuing.',
        ]);
    }

    private function dispatchReadyEvents(Collection $appraisalIds, User $actor): void
    {
        Appraisal::query()
            ->whereIn('id', $appraisalIds->unique()->values())
            ->get()
            ->each(fn (Appraisal $appraisal) => event(new AppraisalStatusChanged(
                $appraisal,
                $actor,
                'auto_self_assessment_ready',
                ['source' => 'my_kpis'],
            )));
    }
}
