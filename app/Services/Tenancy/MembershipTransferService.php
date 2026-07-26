<?php

namespace App\Services\Tenancy;

use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class MembershipTransferService
{
    public function transfer(User $user, Organization $targetOrganization): OrganizationMembership
    {
        $previousOrganization = app(TenantContext::class)->organization();
        $previousSupportAccess = app(TenantContext::class)->isSupportAccess();

        try {
            return DB::transaction(function () use ($user, $targetOrganization): OrganizationMembership {
                $memberships = OrganizationMembership::query()
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->get();
                $now = now();

                foreach ($memberships as $membership) {
                    $isTarget = $membership->organization_id === $targetOrganization->id;

                    if ($membership->status === 'active' && ! $isTarget) {
                        $membership->forceFill([
                            'status' => 'suspended',
                            'is_default' => false,
                            'suspended_at' => $now,
                        ])->save();
                    } elseif ($membership->is_default && ! $isTarget) {
                        $membership->forceFill(['is_default' => false])->save();
                    }
                }

                $targetMembership = $memberships->firstWhere('organization_id', $targetOrganization->id)
                    ?? new OrganizationMembership([
                        'organization_id' => $targetOrganization->id,
                        'user_id' => $user->id,
                        'access_all_locations' => false,
                        'invited_at' => $now,
                    ]);

                $targetMembership->forceFill([
                    'status' => 'active',
                    'is_default' => true,
                    'activated_at' => $now,
                    'suspended_at' => null,
                ])->save();

                app(TenantContext::class)->set($targetOrganization);
                app(PermissionRegistrar::class)->setPermissionsTeamId($targetOrganization->id);
                $user->unsetRelation('roles')->unsetRelation('permissions');

                if (! $user->roles()->exists()) {
                    $employeeRole = Role::query()
                        ->where('organization_id', $targetOrganization->id)
                        ->where('name', 'Employee')
                        ->where('guard_name', 'web')
                        ->first();

                    if ($employeeRole) {
                        $user->assignRole($employeeRole);
                    }
                }

                return $targetMembership->refresh();
            });
        } finally {
            $user->unsetRelation('roles')->unsetRelation('permissions');

            if ($previousOrganization) {
                app(TenantContext::class)->set($previousOrganization, $previousSupportAccess);
                app(PermissionRegistrar::class)->setPermissionsTeamId($previousOrganization->id);
            } else {
                app(TenantContext::class)->clear();
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        }
    }
}
