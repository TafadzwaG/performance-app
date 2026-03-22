<?php

namespace App\Policies;

use App\Models\RatingScale;
use App\Models\User;

class RatingScalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('performance.setup.rating_scales.view');
    }

    public function view(User $user, RatingScale $ratingScale): bool
    {
        return $user->can('performance.setup.rating_scales.view');
    }

    public function create(User $user): bool
    {
        return $user->can('performance.setup.rating_scales.create');
    }

    public function update(User $user, RatingScale $ratingScale): bool
    {
        return $user->can('performance.setup.rating_scales.update');
    }

    public function delete(User $user, RatingScale $ratingScale): bool
    {
        return $user->can('performance.setup.rating_scales.archive');
    }
}
