<?php

namespace App\Policies;

use App\Models\ReviewCycle;
use App\Models\User;

class ReviewCyclePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('performance.review_cycles.view');
    }

    public function view(User $user, ReviewCycle $reviewCycle): bool
    {
        return $user->can('performance.review_cycles.view');
    }

    public function create(User $user): bool
    {
        return $user->can('performance.review_cycles.create');
    }

    public function update(User $user, ReviewCycle $reviewCycle): bool
    {
        return $user->can('performance.review_cycles.update');
    }

    public function delete(User $user, ReviewCycle $reviewCycle): bool
    {
        return $user->can('performance.review_cycles.update');
    }
}
