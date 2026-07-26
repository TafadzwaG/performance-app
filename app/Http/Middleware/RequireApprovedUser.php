<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RequireApprovedUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $context = app(TenantContext::class);
        $membershipIsActive = $user?->memberships()
            ->where('organization_id', $context->id())
            ->where('status', 'active')
            ->exists();

        if ($user && ! ($membershipIsActive || ($user->is_platform_admin && $context->isSupportAccess()))) {
            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('pending-approval')
                ->with('error', 'Your account is pending admin approval.');
        }

        return $next($request);
    }
}
