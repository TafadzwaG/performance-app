<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Role;
use App\Support\Performance\PerformancePermissions;
use App\Tenancy\TenantContext;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Organization::query()->where('status', 'active')->each(function (Organization $organization): void {
            app(TenantContext::class)->set($organization);
            app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

            foreach (PerformancePermissions::starterRoles() as $roleName => $permissions) {
                $role = Role::query()->firstOrCreate([
                    'organization_id' => $organization->id,
                    'name' => $roleName,
                    'guard_name' => 'web',
                ]);

                $role->syncPermissions($permissions);
            }
        });

        if (app()->environment('testing') && ($organization = Organization::query()->where('status', 'active')->first())) {
            app(TenantContext::class)->set($organization);
            app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
        } else {
            app(TenantContext::class)->clear();
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        }
    }
}
