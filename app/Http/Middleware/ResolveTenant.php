<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantContext;
use App\Tenancy\TenantSessionResolver;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(
        private readonly TenantSessionResolver $tenantSessionResolver,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $resolution = $this->tenantSessionResolver->resolveForUser($user, $request);

        if (! $resolution) {
            if ($request->session()->has('organization_id')) {
                $request->session()->forget(['organization_id', 'platform_support_reason']);
            }

            return redirect()->route('organizations.select');
        }

        $this->tenantSessionResolver->apply($resolution);
        $user->unsetRelation('roles')->unsetRelation('permissions');

        try {
            return $next($request);
        } finally {
            app(TenantContext::class)->clear();
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        }
    }
}
