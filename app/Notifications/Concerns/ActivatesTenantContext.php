<?php

namespace App\Notifications\Concerns;

use App\Models\Organization;
use App\Tenancy\TenantContext;
use Spatie\Permission\PermissionRegistrar;

trait ActivatesTenantContext
{
    protected function activateTenantContext(?int $organizationId): void
    {
        if (! $organizationId || app(TenantContext::class)->id() === $organizationId) {
            return;
        }

        $organization = Organization::query()->find($organizationId);
        if ($organization) {
            app(TenantContext::class)->set($organization);
            app(PermissionRegistrar::class)->setPermissionsTeamId($organizationId);
        }
    }
}
