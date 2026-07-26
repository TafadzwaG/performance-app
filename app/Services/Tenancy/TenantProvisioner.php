<?php

namespace App\Services\Tenancy;

use App\Models\Location;
use App\Models\Organization;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\Performance\PerformancePermissions;
use App\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class TenantProvisioner
{
    /** @param array{name:string,slug:string,timezone:string,admin_user_id:int} $data */
    public function create(array $data): Organization
    {
        $previousOrganization = app(TenantContext::class)->organization();
        $previousSupportAccess = app(TenantContext::class)->isSupportAccess();

        try {
            return DB::transaction(function () use ($data): Organization {
                $organization = Organization::query()->create([
                    'name' => $data['name'],
                    'slug' => $data['slug'],
                    'status' => 'active',
                    'timezone' => $data['timezone'],
                ]);

                app(TenantContext::class)->set($organization);
                app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

                Location::query()->create([
                    'organization_id' => $organization->id,
                    'name' => 'Main Location',
                    'code' => 'MAIN',
                    'timezone' => $organization->timezone,
                    'is_active' => true,
                ]);
                $organization->settings()->create();

                foreach (PerformancePermissions::all() as $permissionName) {
                    Permission::query()->firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
                }

                foreach (PerformancePermissions::starterRoles() as $roleName => $permissions) {
                    $role = Role::query()->firstOrCreate([
                        'organization_id' => $organization->id,
                        'name' => $roleName,
                        'guard_name' => 'web',
                    ]);
                    $role->syncPermissions($permissions);
                }

                $admin = User::withoutGlobalScopes()->findOrFail($data['admin_user_id']);

                $admin->memberships()->updateOrCreate(
                    ['organization_id' => $organization->id],
                    [
                        'status' => 'active',
                        'is_default' => ! $admin->memberships()->where('status', 'active')->exists(),
                        'access_all_locations' => true,
                        'invited_at' => now(),
                        'activated_at' => now(),
                    ],
                );
                $admin->syncRoles(['Super Admin']);

                return $organization;
            });
        } finally {
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
