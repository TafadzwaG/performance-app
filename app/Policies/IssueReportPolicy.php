<?php

namespace App\Policies;

use App\Enums\IssueStatus;
use App\Models\IssueReport;
use App\Models\User;

class IssueReportPolicy
{
    public function before(User $user): ?bool
    {
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('issues.view_all') || $user->can('issues.view_own');
    }

    public function view(User $user, IssueReport $issueReport): bool
    {
        if ($user->can('issues.view_all')) {
            return true;
        }

        return $user->can('issues.view_own')
            && (int) $issueReport->reporter_user_id === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('issues.create');
    }

    public function update(User $user, IssueReport $issueReport): bool
    {
        if ($user->can('issues.assign') || $user->can('issues.update_status')) {
            return true;
        }

        if ($issueReport->status === IssueStatus::Completed) {
            return false;
        }

        return $user->can('issues.view_own')
            && (int) $issueReport->reporter_user_id === (int) $user->id;
    }

    public function assign(User $user, IssueReport $issueReport): bool
    {
        return $user->can('issues.assign');
    }

    public function updateStatus(User $user, IssueReport $issueReport): bool
    {
        return $user->can('issues.update_status');
    }
}
