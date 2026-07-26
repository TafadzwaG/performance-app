<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;
use App\Tenancy\TenantContext;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('access.roles.view');
    }

    public function view(User $user, Role $role): bool
    {
        return $this->belongsToCurrentOrganization($role)
            && $user->can('access.roles.view');
    }

    public function create(User $user): bool
    {
        return $user->can('access.roles.create');
    }

    public function update(User $user, Role $role): bool
    {
        return $this->belongsToCurrentOrganization($role)
            && $user->can('access.roles.update');
    }

    public function delete(User $user, Role $role): bool
    {
        return $this->belongsToCurrentOrganization($role)
            && $user->can('access.roles.update');
    }

    private function belongsToCurrentOrganization(Role $role): bool
    {
        return (int) $role->organization_id === app(TenantContext::class)->requireId();
    }
}
