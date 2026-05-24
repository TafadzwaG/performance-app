<?php

namespace App\Policies;

use App\Models\GoalLibraryItem;
use App\Models\User;
use App\Services\Performance\GoalLibraryScopeService;

class GoalLibraryItemPolicy
{
    public function __construct(
        private readonly GoalLibraryScopeService $goalLibraryScope,
    ) {}

    public function viewAny(User $user): bool
    {
        return $user->can('performance.goal_library.view');
    }

    public function view(User $user, GoalLibraryItem $goalLibraryItem): bool
    {
        return $user->can('performance.goal_library.view')
            && $this->goalLibraryScope->itemAccessible($user, $goalLibraryItem);
    }

    public function create(User $user): bool
    {
        return $user->can('performance.goal_library.create');
    }

    public function update(User $user, GoalLibraryItem $goalLibraryItem): bool
    {
        return $user->can('performance.goal_library.update')
            && $this->goalLibraryScope->itemAccessible($user, $goalLibraryItem);
    }

    public function delete(User $user, GoalLibraryItem $goalLibraryItem): bool
    {
        return $user->can('performance.goal_library.archive')
            && $this->goalLibraryScope->itemAccessible($user, $goalLibraryItem);
    }
}
