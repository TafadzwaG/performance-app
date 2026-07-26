<?php

namespace App\Services\Performance;

use App\Enums\ReviewCycleStatus;
use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\Organization;
use App\Models\ReviewCycle;
use App\Tenancy\TenantContext;
use Illuminate\Support\Collection;

class DashboardGoalSettingCoverageService
{
    public function __construct(
        private readonly TenantContext $tenantContext,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function report(): array
    {
        $organization = $this->tenantContext->organization()
            ?? Organization::query()->find($this->tenantContext->requireId());

        $templateContext = $this->resolveTemplateContext();
        $profiles = EmployeeProfile::query()
            ->with(['user:id,name,email', 'department:id,name', 'jobTitle:id,name'])
            ->where('is_active', true)
            ->where('is_review_eligible', true)
            ->orderBy('employee_number')
            ->get();

        $kpisByScope = GoalLibraryItem::query()
            ->where('is_active', true)
            ->get()
            ->groupBy(fn (GoalLibraryItem $item) => $this->scopeKey($item->department_id, $item->job_title_id));

        $incompleteProfiles = $profiles
            ->filter(fn (EmployeeProfile $profile) => ! $profile->department_id || ! $profile->job_title_id)
            ->map(fn (EmployeeProfile $profile) => $this->formatEmployee($profile))
            ->values()
            ->all();

        $scopedProfiles = $profiles
            ->filter(fn (EmployeeProfile $profile) => $profile->department_id && $profile->job_title_id)
            ->groupBy(fn (EmployeeProfile $profile) => $this->scopeKey($profile->department_id, $profile->job_title_id));

        $scopes = $scopedProfiles
            ->map(function (Collection $employees, string $scopeKey) use ($kpisByScope, $templateContext) {
                /** @var EmployeeProfile $sample */
                $sample = $employees->first();
                $kpis = $kpisByScope->get($scopeKey, collect());
                $analysis = $this->analyzeScope($kpis, $templateContext);

                return [
                    'department_id' => $sample->department_id,
                    'department_name' => $sample->department?->name ?? 'Unknown department',
                    'job_title_id' => $sample->job_title_id,
                    'job_title_name' => $sample->jobTitle?->name ?? 'Unknown job title',
                    'kpi_count' => $kpis->count(),
                    'kpi_weight_total' => round((float) $kpis->sum('default_weight'), 2),
                    'status' => $analysis['status'],
                    'issues' => $analysis['issues'],
                    'issue_messages' => $analysis['issue_messages'],
                    'employee_count' => $employees->count(),
                    'employees' => $employees
                        ->map(fn (EmployeeProfile $profile) => $this->formatEmployee($profile))
                        ->values()
                        ->all(),
                ];
            })
            ->sortBy([
                ['department_name', 'asc'],
                ['job_title_name', 'asc'],
            ])
            ->values()
            ->all();

        $blockedScopes = collect($scopes)->where('status', 'blocked');
        $employeesBlocked = $blockedScopes->sum('employee_count');
        $employeesReady = max(0, $scopedProfiles->flatten()->count() - $employeesBlocked);

        $departments = collect($scopes)
            ->groupBy('department_id')
            ->map(function (Collection $departmentScopes, int|string $departmentId) {
                $first = $departmentScopes->first();

                return [
                    'department_id' => (int) $departmentId,
                    'department_name' => $first['department_name'],
                    'scope_count' => $departmentScopes->count(),
                    'blocked_scope_count' => $departmentScopes->where('status', 'blocked')->count(),
                    'employee_count' => $departmentScopes->sum('employee_count'),
                    'employees_blocked' => $departmentScopes->where('status', 'blocked')->sum('employee_count'),
                ];
            })
            ->sortBy('department_name')
            ->values()
            ->all();

        return [
            'organization' => [
                'id' => $organization?->id,
                'name' => $organization?->name,
            ],
            'template' => $templateContext,
            'summary' => [
                'eligible_employees' => $profiles->count(),
                'scoped_employees' => $scopedProfiles->flatten()->count(),
                'incomplete_profiles' => count($incompleteProfiles),
                'total_scopes' => count($scopes),
                'ready_scopes' => collect($scopes)->where('status', 'ready')->count(),
                'blocked_scopes' => $blockedScopes->count(),
                'employees_ready' => $employeesReady,
                'employees_blocked' => $employeesBlocked,
                'departments_with_gaps' => collect($departments)->where('blocked_scope_count', '>', 0)->count(),
            ],
            'departments' => $departments,
            'scopes' => $scopes,
            'incomplete_profiles' => $incompleteProfiles,
        ];
    }

    /**
     * @return array{name:string,min_objectives:int,max_objectives:int,source:string,cycle_name:?string}
     */
    private function resolveTemplateContext(): array
    {
        $openCycle = ReviewCycle::query()
            ->with('template')
            ->where('status', ReviewCycleStatus::Open)
            ->latest('opened_at')
            ->first();

        if ($openCycle?->template && $openCycle->template->is_active) {
            return [
                'name' => $openCycle->template->name,
                'min_objectives' => (int) $openCycle->template->min_objectives,
                'max_objectives' => (int) $openCycle->template->max_objectives,
                'source' => 'open_cycle',
                'cycle_name' => $openCycle->name,
            ];
        }

        $defaultTemplate = AppraisalTemplate::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->first();

        if ($defaultTemplate) {
            return [
                'name' => $defaultTemplate->name,
                'min_objectives' => (int) $defaultTemplate->min_objectives,
                'max_objectives' => (int) $defaultTemplate->max_objectives,
                'source' => 'default_template',
                'cycle_name' => null,
            ];
        }

        return [
            'name' => 'Standard template rules',
            'min_objectives' => 4,
            'max_objectives' => 6,
            'source' => 'fallback',
            'cycle_name' => null,
        ];
    }

    /**
     * @param  Collection<int, GoalLibraryItem>  $kpis
     * @param  array{name:string,min_objectives:int,max_objectives:int,source:string,cycle_name:?string}  $templateContext
     * @return array{status:string,issues:list<string>,issue_messages:list<string>}
     */
    private function analyzeScope(Collection $kpis, array $templateContext): array
    {
        $issues = [];
        $messages = [];

        if ($kpis->isEmpty()) {
            $issues[] = 'no_kpis';
            $messages[] = 'No active My KPIs match this department and job title.';
        } else {
            if ($kpis->contains(fn (GoalLibraryItem $item) => (float) $item->default_weight <= 0)) {
                $issues[] = 'zero_weight';
                $messages[] = 'Every matching KPI must have a weight greater than zero.';
            }

            if (round((float) $kpis->sum('default_weight'), 2) !== 100.0) {
                $issues[] = 'invalid_weights';
                $messages[] = 'Matching KPI weights must total exactly 100%.';
            }

            if ($kpis->count() < $templateContext['min_objectives']) {
                $issues[] = 'below_minimum';
                $messages[] = "At least {$templateContext['min_objectives']} KPIs are required by the selected template.";
            }

            if ($kpis->count() > $templateContext['max_objectives']) {
                $issues[] = 'above_maximum';
                $messages[] = "No more than {$templateContext['max_objectives']} KPIs are allowed by the selected template.";
            }
        }

        return [
            'status' => $issues === [] ? 'ready' : 'blocked',
            'issues' => $issues,
            'issue_messages' => $messages,
        ];
    }

    /**
     * @return array{id:int,name:string,email:?string,employee_number:?string,department_name:?string,job_title_name:?string}
     */
    private function formatEmployee(EmployeeProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'name' => $profile->user?->name ?? 'Unknown employee',
            'email' => $profile->user?->email,
            'employee_number' => $profile->employee_number,
            'department_name' => $profile->department?->name,
            'job_title_name' => $profile->jobTitle?->name,
        ];
    }

    private function scopeKey(mixed $departmentId, mixed $jobTitleId): string
    {
        return (int) $departmentId.':'.(int) $jobTitleId;
    }
}
