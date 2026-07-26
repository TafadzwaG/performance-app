<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Perspective;
use App\Tenancy\TenantContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class CarribeanBayKpiSeeder extends Seeder
{
    public function run(): void
    {
        $organization = Organization::query()
            ->where('slug', 'carribean_bay')
            ->where('status', 'active')
            ->firstOrFail();
        $tenantContext = app(TenantContext::class);
        $previousOrganization = $tenantContext->organization();
        $previousSupportAccess = $tenantContext->isSupportAccess();

        $tenantContext->set($organization);
        app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

        try {
            DB::transaction(function (): void {
                $this->seedPerspectives();
                $this->call(JobTitleGoalLibrarySeeder::class);
            });
        } finally {
            if ($previousOrganization) {
                $tenantContext->set($previousOrganization, $previousSupportAccess);
                app(PermissionRegistrar::class)->setPermissionsTeamId($previousOrganization->id);
            } else {
                $tenantContext->clear();
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        }
    }

    private function seedPerspectives(): void
    {
        foreach ([
            [
                'name' => 'Financial',
                'code' => 'financial',
                'description' => 'To succeed financially, how should we appear to our shareholders?',
                'sort_order' => 1,
            ],
            [
                'name' => 'Customer',
                'code' => 'customer',
                'description' => 'To achieve our vision, how should we appear to our customers?',
                'sort_order' => 2,
            ],
            [
                'name' => 'Internal Process',
                'code' => 'internal_process',
                'description' => 'To satisfy our shareholders and customers, what business processes must we excel at?',
                'sort_order' => 3,
            ],
            [
                'name' => 'Learning/Growth',
                'code' => 'learning_growth',
                'description' => 'To achieve our vision, how will we sustain our ability to change and improve?',
                'sort_order' => 4,
            ],
        ] as $attributes) {
            $perspective = Perspective::withTrashed()->firstOrNew([
                'code' => $attributes['code'],
            ]);
            $perspective->fill($attributes + ['is_active' => true]);

            if ($perspective->trashed()) {
                $perspective->restore();
            }

            $perspective->save();
        }
    }
}
