<?php

namespace App\Policies;

use App\Models\JobTitle;
use App\Models\User;

class JobTitlePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('performance.setup.job_titles.view');
    }

    public function view(User $user, JobTitle $jobTitle): bool
    {
        return $user->can('performance.setup.job_titles.view');
    }

    public function create(User $user): bool
    {
        return $user->can('performance.setup.job_titles.create');
    }

    public function update(User $user, JobTitle $jobTitle): bool
    {
        return $user->can('performance.setup.job_titles.update');
    }

    public function delete(User $user, JobTitle $jobTitle): bool
    {
        return $user->can('performance.setup.job_titles.archive');
    }
}
