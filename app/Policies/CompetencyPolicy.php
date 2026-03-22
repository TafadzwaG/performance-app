<?php

namespace App\Policies;

use App\Models\Competency;
use App\Models\User;

class CompetencyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('performance.setup.competencies.view');
    }

    public function view(User $user, Competency $competency): bool
    {
        return $user->can('performance.setup.competencies.view');
    }

    public function create(User $user): bool
    {
        return $user->can('performance.setup.competencies.create');
    }

    public function update(User $user, Competency $competency): bool
    {
        return $user->can('performance.setup.competencies.update');
    }

    public function delete(User $user, Competency $competency): bool
    {
        return $user->can('performance.setup.competencies.archive');
    }
}
