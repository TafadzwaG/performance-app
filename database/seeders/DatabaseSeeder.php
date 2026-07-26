<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Tenancy\TenantContext;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
        ]);

        $organization = Organization::query()->where('status', 'active')->firstOrFail();
        app(TenantContext::class)->set($organization);
        app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

        try {
            $this->call([
                PerformanceSetupSeeder::class,
                HotelOrgStructureSeeder::class,
                JobTitleGoalLibrarySeeder::class,
                EmployeeFieldSettingsSeeder::class,
            ]);

            if (app()->environment(['local', 'testing'])) {
                $this->call([
                    PerformanceTestingSeeder::class,
                    EmployeePerformanceTrendSeeder::class,
                ]);
            }
        } finally {
            if (app()->environment('testing')) {
                app(TenantContext::class)->set($organization);
                app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);
            } else {
                app(TenantContext::class)->clear();
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        }
    }
}
