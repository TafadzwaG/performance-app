<?php

namespace App\Http\Middleware;

use App\Tenancy\TenantContext;
use App\Tenancy\TenantSessionResolver;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

/**
 * Makes an already selected tenant available to global web middleware (notably
 * Inertia shared props) before route middleware runs. Enforcement and tenant
 * selection redirects remain the responsibility of ResolveTenant.
 */
class InitializeTenantContext
{
    public function __construct(
        private readonly TenantSessionResolver $tenantSessionResolver,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $previousOrganization = app(TenantContext::class)->organization();
        $previousSupportAccess = app(TenantContext::class)->isSupportAccess();
        $user = $request->user();
        $initializedOrganization = null;
        $supportAccess = false;

        $resolution = $user
            ? $this->tenantSessionResolver->resolveForUser($user, $request)
            : $this->tenantSessionResolver->resolveFromSession($request);

        if ($resolution) {
            $this->tenantSessionResolver->apply($resolution);
            $user?->unsetRelation('roles')->unsetRelation('permissions');
            $initializedOrganization = $resolution->organization;
            $supportAccess = $resolution->supportAccess;
        }

        try {
            return $next($request);
        } finally {
            if ($previousOrganization) {
                app(TenantContext::class)->set($previousOrganization, $previousSupportAccess);
                app(PermissionRegistrar::class)->setPermissionsTeamId($previousOrganization->id);
            } elseif (app()->environment('testing') && $initializedOrganization) {
                app(TenantContext::class)->set($initializedOrganization, $supportAccess);
                app(PermissionRegistrar::class)->setPermissionsTeamId($initializedOrganization->id);
            } else {
                app(TenantContext::class)->clear();
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        }
    }
}
