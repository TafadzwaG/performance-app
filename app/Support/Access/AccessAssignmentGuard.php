<?php

namespace App\Support\Access;

use App\Models\User;

class AccessAssignmentGuard
{
    public static function authorizeRoleAssignment(User $actor): void
    {
        abort_unless($actor->can('access.roles.assign_users'), 403);
    }

    public static function authorizePermissionAssignment(User $actor): void
    {
        abort_unless($actor->can('access.roles.assign_permissions'), 403);
    }
}
