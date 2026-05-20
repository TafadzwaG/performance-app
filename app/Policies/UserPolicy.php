<?php

namespace App\Policies;

use App\Models\User;

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
        return $user->can('access.users.view');
    }

    public function update(User $user, User $managedUser): bool
    {
        return $user->can('access.users.update');
    }

    public function impersonate(User $user, User $managedUser): bool
    {
        return $user->id !== $managedUser->id
            && ! app('impersonate')->isImpersonating()
            && $user->canImpersonate()
            && $managedUser->canBeImpersonated();
    }

    public function import(User $user): bool
    {
        return $user->can('access.users.import');
    }

    public function approve(User $user, User $managedUser): bool
    {
        return $user->id !== $managedUser->id
            && ! $managedUser->is_approved
            && $user->can('access.users.approve');
    }

    public function delete(User $user, User $managedUser): bool
    {
        return $user->id !== $managedUser->id
            && $user->can('access.users.delete');
    }
}
