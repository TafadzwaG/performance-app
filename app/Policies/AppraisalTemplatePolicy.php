<?php

namespace App\Policies;

use App\Models\AppraisalTemplate;
use App\Models\User;

class AppraisalTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('performance.templates.view');
    }

    public function view(User $user, AppraisalTemplate $template): bool
    {
        return $user->can('performance.templates.view');
    }

    public function create(User $user): bool
    {
        return $user->can('performance.templates.create');
    }

    public function update(User $user, AppraisalTemplate $template): bool
    {
        return $user->can('performance.templates.update');
    }

    public function delete(User $user, AppraisalTemplate $template): bool
    {
        return $user->can('performance.templates.archive');
    }
}
