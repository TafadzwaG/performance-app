<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
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
}
