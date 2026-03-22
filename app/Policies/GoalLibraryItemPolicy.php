<?php

namespace App\Policies;

use App\Models\GoalLibraryItem;
use App\Models\User;

class GoalLibraryItemPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('performance.goal_library.view');
    }

    public function view(User $user, GoalLibraryItem $goalLibraryItem): bool
    {
        return $user->can('performance.goal_library.view');
    }

    public function create(User $user): bool
    {
        return $user->can('performance.goal_library.create');
    }

    public function update(User $user, GoalLibraryItem $goalLibraryItem): bool
    {
        return $user->can('performance.goal_library.update');
    }

    public function delete(User $user, GoalLibraryItem $goalLibraryItem): bool
    {
        return $user->can('performance.goal_library.archive');
    }
}
