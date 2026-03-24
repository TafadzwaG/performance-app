<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordChange
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->force_password_change) {
            return $next($request);
        }

        if ($request->routeIs([
            'password.edit',
            'password.update',
            'logout',
            'access.impersonation.destroy',
        ])) {
            return $next($request);
        }

        return redirect()->route('password.edit');
    }
}
