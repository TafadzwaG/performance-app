<?php

use App\Models\Permission;
use App\Models\Role;
use App\Support\Performance\PerformancePermissions;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PerformancePermissions::all() as $permissionName) {
            Permission::query()->firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        foreach (PerformancePermissions::starterRoles() as $roleName => $permissions) {
            $role = Role::query()
                ->where('name', $roleName)
                ->where('guard_name', 'web')
                ->first();

            if ($role === null) {
                continue;
            }

            $role->syncPermissions($permissions);
        }
    }

    public function down(): void
    {
        // Permissions remain registered; role sync is not reversed.
    }
};
