<?php

namespace App\Policies;

use App\Models\EmployeeProfile;
use App\Models\User;

class EmployeeProfilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('performance.employees.view');
    }

    public function view(User $user, EmployeeProfile $employeeProfile): bool
    {
        return $user->can('performance.employees.view') || $employeeProfile->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('performance.employees.create');
    }

    public function update(User $user, EmployeeProfile $employeeProfile): bool
    {
        return $user->can('performance.employees.update');
    }

    public function delete(User $user, EmployeeProfile $employeeProfile): bool
    {
        return $user->can('performance.employees.update');
    }
}
