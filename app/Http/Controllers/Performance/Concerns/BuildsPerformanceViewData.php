<?php

namespace App\Http\Controllers\Performance\Concerns;

use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\Competency;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\RatingScale;
use App\Models\ReviewCycle;
use App\Models\Role;
use App\Models\User;
use App\Support\Performance\PerformancePermissions;

trait BuildsPerformanceViewData
{
    protected function departmentOptions(): array
    {
        return Department::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (Department $department) => [
                'value' => $department->id,
                'label' => $department->name,
                'code' => $department->code,
            ])
            ->all();
    }

    protected function jobTitleOptions(): array
    {
        return JobTitle::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (JobTitle $jobTitle) => [
                'value' => $jobTitle->id,
                'label' => $jobTitle->name,
                'code' => $jobTitle->code,
            ])
            ->all();
    }

    protected function userOptions(): array
    {
        return User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'value' => $user->id,
                'label' => $user->name,
                'email' => $user->email,
            ])
            ->all();
    }

    protected function perspectiveOptions(): array
    {
        return Perspective::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (Perspective $perspective) => [
                'value' => $perspective->id,
                'label' => $perspective->name,
                'code' => $perspective->code,
            ])
            ->all();
    }

    protected function competencyOptions(): array
    {
        return Competency::query()
            ->with(['department:id,name', 'jobTitle:id,name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Competency $competency) => [
                'value' => $competency->id,
                'label' => $competency->name,
                'category' => $competency->category?->value ?? $competency->category,
                'department' => $competency->department?->name,
                'job_title' => $competency->jobTitle?->name,
            ])
            ->all();
    }

    protected function ratingScaleOptions(?string $type = null): array
    {
        return RatingScale::query()
            ->when($type, fn ($query) => $query->where('applies_to', $type))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'applies_to'])
            ->map(fn (RatingScale $scale) => [
                'value' => $scale->id,
                'label' => $scale->name,
                'code' => $scale->code,
                'type' => $scale->applies_to?->value ?? $scale->applies_to,
            ])
            ->all();
    }

    protected function templateOptions(): array
    {
        return AppraisalTemplate::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'version'])
            ->map(fn (AppraisalTemplate $template) => [
                'value' => $template->id,
                'label' => "{$template->name} (v{$template->version})",
                'code' => $template->code,
            ])
            ->all();
    }

    protected function reviewCycleOptions(): array
    {
        return ReviewCycle::query()
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'code', 'status'])
            ->map(fn (ReviewCycle $cycle) => [
                'value' => $cycle->id,
                'label' => $cycle->name,
                'code' => $cycle->code,
                'status' => $cycle->status?->value ?? $cycle->status,
            ])
            ->all();
    }

    protected function employeeProfileOptions(): array
    {
        return EmployeeProfile::query()
            ->with(['user:id,name,email', 'department:id,name', 'jobTitle:id,name'])
            ->orderBy('employee_number')
            ->get()
            ->map(fn (EmployeeProfile $profile) => [
                'value' => $profile->id,
                'label' => "{$profile->employee_number} - {$profile->user?->name}",
                'employee_number' => $profile->employee_number,
                'department' => $profile->department?->name,
                'job_title' => $profile->jobTitle?->name,
                'approving_manager_user_id' => $profile->approving_manager_user_id,
            ])
            ->all();
    }

    protected function roleOptions(): array
    {
        return Role::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Role $role) => [
                'value' => $role->id,
                'label' => $role->name,
            ])
            ->all();
    }

    protected function permissionGroups(): array
    {
        $permissions = Permission::query()->orderBy('name')->get(['id', 'name']);

        return collect(PerformancePermissions::definitions())
            ->map(fn (array $names, string $group) => [
                'group' => $group,
                'permissions' => $permissions
                    ->whereIn('name', $names)
                    ->values()
                    ->map(fn (Permission $permission) => [
                        'id' => $permission->id,
                        'name' => $permission->name,
                    ])
                    ->all(),
            ])
            ->values()
            ->all();
    }

    protected function loadAppraisal(Appraisal $appraisal): Appraisal
    {
        return $appraisal->load([
            'reviewCycle',
            'employeeProfile.user.roles',
            'employeeProfile.department',
            'employeeProfile.jobTitle',
            'employee',
            'lineManager',
            'approvingManager',
            'template.objectiveRatingScale.levels',
            'template.competencyRatingScale.levels',
            'template.overallRatingScale.levels',
            'template.items.perspective',
            'template.items.competency',
            'objectives.perspective',
            'objectives.goalLibraryItem',
            'objectives.selfRatingLevel',
            'objectives.managerRatingLevel',
            'objectives.evidences',
            'competencyRatings.competency',
            'competencyRatings.selfRatingLevel',
            'competencyRatings.managerRatingLevel',
            'comments.author',
            'approvals.actor',
            'statusHistories.actor',
            'developmentPlan.actions.owner',
            'overallRatingLevel',
        ]);
    }
}
