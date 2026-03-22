<?php

namespace App\Policies;

use App\Models\Perspective;
use App\Models\User;

class PerspectivePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('performance.setup.perspectives.view');
    }

    public function view(User $user, Perspective $perspective): bool
    {
        return $user->can('performance.setup.perspectives.view');
    }

    public function create(User $user): bool
    {
        return $user->can('performance.setup.perspectives.create');
    }

    public function update(User $user, Perspective $perspective): bool
    {
        return $user->can('performance.setup.perspectives.update');
    }

    public function delete(User $user, Perspective $perspective): bool
    {
        return $user->can('performance.setup.perspectives.archive');
    }
}
