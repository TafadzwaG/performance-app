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

        if ($request->routeIs([
            'employee-profile.complete',
            'employee-profile.complete.store',
            'password.edit',
            'password.update',
            'access.impersonation.destroy',
        ])) {
            return $next($request);
        }

        return redirect()->route('employee-profile.complete');
    }
}
