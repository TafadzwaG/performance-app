<?php

namespace App\Policies;

use App\Models\User;
use App\Tenancy\TenantContext;

class UserPolicy
{
    public function create(User $user): bool
    {
        return $user->can('access.users.create');
    }

    public function viewAny(User $user): bool
    {
        return $user->can('access.users.view');
    }

    public function view(User $user, User $managedUser): bool
    {
        return $user->can('access.users.view') && $this->withinLocationScope($user, $managedUser);
    }

    public function update(User $user, User $managedUser): bool
    {
        return $user->can('access.users.update') && $this->withinLocationScope($user, $managedUser);
    }

    public function impersonate(User $user, User $managedUser): bool
    {
        return $user->id !== $managedUser->id
            && ! app('impersonate')->isImpersonating()
            && $user->canImpersonate()
            && $this->withinLocationScope($user, $managedUser)
            && $managedUser->canBeImpersonated();
    }

    public function import(User $user): bool
    {
        return $user->can('access.users.import');
    }

    public function approve(User $user, User $managedUser): bool
    {
        return $user->id !== $managedUser->id
            && $managedUser->memberships()->where('organization_id', app(TenantContext::class)->requireId())->where('status', 'invited')->exists()
            && $this->withinLocationScope($user, $managedUser)
            && $user->can('access.users.approve');
    }

    public function delete(User $user, User $managedUser): bool
    {
        return $user->id !== $managedUser->id
            && $user->can('access.users.delete')
            && $this->withinLocationScope($user, $managedUser);
    }

    private function withinLocationScope(User $actor, User $managedUser): bool
    {
        if ($actor->id === $managedUser->id) {
            return true;
        }

        $locationIds = app(TenantContext::class)->allowedLocationIds($actor);

        return $locationIds === null || $managedUser->employeeProfile()
            ->withoutGlobalScope('location_visibility')
            ->whereIn('location_id', $locationIds)
            ->exists();
    }
}
