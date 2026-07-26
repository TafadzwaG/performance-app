<?php

namespace App\Policies;

use App\Models\Location;
use App\Models\User;
use App\Tenancy\TenantContext;

class LocationPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->hasOrganizationScope($user) && $user->can('performance.setup.locations.view');
    }

    public function view(User $user, Location $location): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->hasOrganizationScope($user) && $user->can('performance.setup.locations.create');
    }

    public function update(User $user, Location $location): bool
    {
        return $this->hasOrganizationScope($user) && $user->can('performance.setup.locations.update');
    }

    public function delete(User $user, Location $location): bool
    {
        return $this->hasOrganizationScope($user) && $user->can('performance.setup.locations.archive');
    }

    private function hasOrganizationScope(User $user): bool
    {
        $context = app(TenantContext::class);

        if ($user->is_platform_admin && $context->isSupportAccess()) {
            return true;
        }

        return $user->memberships()
            ->where('organization_id', $context->id())
            ->where('status', 'active')
            ->where('access_all_locations', true)
            ->exists();
    }
}
