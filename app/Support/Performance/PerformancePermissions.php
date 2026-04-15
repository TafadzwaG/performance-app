<?php

namespace App\Support\Performance;

class PerformancePermissions
{
    public static function definitions(): array
    {
        return [
            'Dashboard' => [
                'performance.dashboard.view',
            ],
            'Departments' => [
                'performance.setup.departments.view',
                'performance.setup.departments.create',
                'performance.setup.departments.update',
                'performance.setup.departments.archive',
            ],
            'Job Titles' => [
                'performance.setup.job_titles.view',
                'performance.setup.job_titles.create',
                'performance.setup.job_titles.update',
                'performance.setup.job_titles.archive',
            ],
            'Perspectives' => [
                'performance.setup.perspectives.view',
                'performance.setup.perspectives.create',
                'performance.setup.perspectives.update',
                'performance.setup.perspectives.archive',
            ],
            'Competencies' => [
                'performance.setup.competencies.view',
                'performance.setup.competencies.create',
                'performance.setup.competencies.update',
                'performance.setup.competencies.archive',
            ],
            'Rating Scales' => [
                'performance.setup.rating_scales.view',
                'performance.setup.rating_scales.create',
                'performance.setup.rating_scales.update',
                'performance.setup.rating_scales.archive',
            ],
            'Employees' => [
                'performance.employees.view',
                'performance.employees.create',
                'performance.employees.update',
                'performance.employees.assign_roles',
                'performance.employees.assign_managers',
            ],
            'Review Cycles' => [
                'performance.review_cycles.view',
                'performance.review_cycles.create',
                'performance.review_cycles.update',
                'performance.review_cycles.open',
                'performance.review_cycles.close',
                'performance.review_cycles.assign_employees',
            ],
            'Templates' => [
                'performance.templates.view',
                'performance.templates.create',
                'performance.templates.update',
                'performance.templates.archive',
            ],
            'Goal Library' => [
                'performance.goal_library.view',
                'performance.goal_library.create',
                'performance.goal_library.update',
                'performance.goal_library.archive',
            ],
            'Appraisals' => [
                'performance.appraisals.view_all',
                'performance.appraisals.view_own',
                'performance.appraisals.plan_own',
                'performance.appraisals.plan_manage',
                'performance.appraisals.self_assess',
                'performance.appraisals.manager_review',
                'performance.appraisals.approve',
                'performance.appraisals.send_back',
                'performance.appraisals.finalize',
                'performance.appraisals.comment',
                'performance.appraisals.upload_evidence',
            ],
            'Development Plans' => [
                'performance.development_plans.view',
                'performance.development_plans.update',
            ],
            'Reports' => [
                'performance.reports.view',
                'performance.reports.export',
                'performance.reports.print',
            ],
            'Access Roles' => [
                'access.roles.view',
                'access.roles.create',
                'access.roles.update',
                'access.roles.assign_permissions',
                'access.roles.assign_users',
                'access.permissions.view',
            ],
            'Access Users' => [
                'access.users.view',
                'access.users.create',
                'access.users.update',
                'access.users.import',
                'access.users.impersonate',
                'access.users.approve',
            ],
            'Audit Trail' => [
                'access.audit_trails.view',
            ],
        ];
    }

    public static function all(): array
    {
        return collect(static::definitions())
            ->flatten()
            ->unique()
            ->values()
            ->all();
    }

    public static function starterRoles(): array
    {
        $all = static::all();

        return [
            'Super Admin' => $all,
            'HR Admin' => [
                'performance.dashboard.view',
                'performance.setup.departments.view',
                'performance.setup.departments.create',
                'performance.setup.departments.update',
                'performance.setup.departments.archive',
                'performance.setup.job_titles.view',
                'performance.setup.job_titles.create',
                'performance.setup.job_titles.update',
                'performance.setup.job_titles.archive',
                'performance.setup.perspectives.view',
                'performance.setup.perspectives.create',
                'performance.setup.perspectives.update',
                'performance.setup.perspectives.archive',
                'performance.setup.competencies.view',
                'performance.setup.competencies.create',
                'performance.setup.competencies.update',
                'performance.setup.competencies.archive',
                'performance.setup.rating_scales.view',
                'performance.setup.rating_scales.create',
                'performance.setup.rating_scales.update',
                'performance.setup.rating_scales.archive',
                'performance.employees.view',
                'performance.employees.create',
                'performance.employees.update',
                'performance.employees.assign_roles',
                'performance.employees.assign_managers',
                'performance.review_cycles.view',
                'performance.review_cycles.create',
                'performance.review_cycles.update',
                'performance.review_cycles.open',
                'performance.review_cycles.close',
                'performance.review_cycles.assign_employees',
                'performance.templates.view',
                'performance.templates.create',
                'performance.templates.update',
                'performance.templates.archive',
                'performance.goal_library.view',
                'performance.goal_library.create',
                'performance.goal_library.update',
                'performance.goal_library.archive',
                'performance.appraisals.view_all',
                'performance.appraisals.plan_manage',
                'performance.appraisals.comment',
                'performance.appraisals.finalize',
                'performance.development_plans.view',
                'performance.development_plans.update',
                'performance.reports.view',
                'performance.reports.export',
                'performance.reports.print',
                'access.roles.view',
                'access.roles.create',
                'access.roles.update',
                'access.roles.assign_permissions',
                'access.roles.assign_users',
                'access.permissions.view',
                'access.users.view',
                'access.users.create',
                'access.users.update',
                'access.users.import',
                'access.audit_trails.view',
            ],
            'Manager' => [
                'performance.dashboard.view',
                'performance.review_cycles.view',
                'performance.templates.view',
                'performance.goal_library.view',
                'performance.appraisals.view_own',
                'performance.appraisals.plan_manage',
                'performance.appraisals.manager_review',
                'performance.appraisals.send_back',
                'performance.appraisals.comment',
                'performance.appraisals.upload_evidence',
                'performance.development_plans.view',
                'performance.development_plans.update',
                'performance.reports.view',
                'performance.reports.print',
            ],
            'Approving Manager' => [
                'performance.dashboard.view',
                'performance.review_cycles.view',
                'performance.appraisals.view_own',
                'performance.appraisals.approve',
                'performance.appraisals.send_back',
                'performance.appraisals.comment',
                'performance.development_plans.view',
                'performance.reports.view',
                'performance.reports.print',
            ],
            'Employee' => [
                'performance.dashboard.view',
                'performance.appraisals.view_own',
                'performance.appraisals.plan_own',
                'performance.appraisals.self_assess',
                'performance.appraisals.comment',
                'performance.appraisals.upload_evidence',
                'performance.development_plans.view',
                'performance.reports.print',
            ],
        ];
    }
}
