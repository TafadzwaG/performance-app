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

        $superAdmin = Role::query()->where('name', 'Super Admin')->where('guard_name', 'web')->first();

        if ($superAdmin !== null) {
            $superAdmin->syncPermissions(PerformancePermissions::all());
        }
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permission = Permission::query()->where('name', 'system.disaster_recovery.manage')->where('guard_name', 'web')->first();

        if ($permission !== null) {
            $permission->delete();
        }
    }
};
