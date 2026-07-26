<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireEmployeeProfileCompletion
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->employeeProfile()->exists()) {
            return $next($request);
        }

        if ($this->userCanAccessModuleWithoutEmployeeProfile($user, $request)) {
            return $next($request);
        }

        if ($request->routeIs([
            'employee-profile.complete',
            'employee-profile.complete.store',
            'password.edit',
            'password.update',
            'logout',
            'access.impersonation.destroy',
        ])) {
            return $next($request);
        }

        return redirect()->route('employee-profile.complete');
    }

    private function userCanAccessModuleWithoutEmployeeProfile($user, Request $request): bool
    {
        $routeName = (string) $request->route()?->getName();

        if (str_starts_with($routeName, 'access.help.')) {
            return true;
        }

        if (str_starts_with($routeName, 'access.') && $this->userHasAccessModulePermission($user)) {
            return true;
        }

        if (str_starts_with($routeName, 'access.storage.') && $user->can('system.settings.manage')) {
            return true;
        }

        if (str_starts_with($routeName, 'settings.') && $user->can('system.settings.manage')) {
            return true;
        }

        if (str_starts_with($routeName, 'performance.') && $user->getAllPermissions()->contains(
            fn ($permission) => str_starts_with($permission->name, 'performance.')
                && ! in_array($permission->name, [
                    'performance.appraisals.view_own',
                    'performance.appraisals.view',
                    'performance.appraisals.self_assess',
                    'performance.development_plans.view',
                ], true),
        )) {
            return true;
        }

        return false;
    }

    private function userHasAccessModulePermission($user): bool
    {
        return $user->getAllPermissions()
            ->contains(fn ($permission) => str_starts_with($permission->name, 'access.'));
    }
}
