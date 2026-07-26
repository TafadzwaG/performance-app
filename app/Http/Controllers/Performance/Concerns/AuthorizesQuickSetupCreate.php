<?php

namespace App\Http\Controllers\Performance\Concerns;

use Illuminate\Http\Request;

trait AuthorizesQuickSetupCreate
{
    protected function authorizeQuickDepartmentCreate(Request $request): void
    {
        $this->authorizeQuickSetupCreate($request, 'performance.setup.departments.create');
    }

    protected function authorizeQuickJobTitleCreate(Request $request): void
    {
        $this->authorizeQuickSetupCreate($request, 'performance.setup.job_titles.create');
    }

    protected function authorizeQuickSetupCreate(Request $request, string $setupPermission): void
    {
        $user = $request->user();

        if ($user?->can($setupPermission)
            || $user?->can('performance.employees.create')
            || $user?->can('performance.employees.update')
            || ! $user?->employeeProfile()->exists()) {
            return;
        }

        abort(403);
    }
}
