<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

return new class extends Migration
{
    /** @var list<string> */
    private array $tenantTables = [
        'departments',
        'job_titles',
        'employee_profiles',
        'review_cycles',
        'perspectives',
        'competencies',
        'appraisal_templates',
        'appraisal_template_items',
        'goal_library_items',
        'appraisals',
        'appraisal_objectives',
        'appraisal_objective_evidence',
        'appraisal_competency_ratings',
        'appraisal_comments',
        'appraisal_approvals',
        'appraisal_status_histories',
        'development_plans',
        'development_plan_actions',
        'appraisal_calibrations',
        'appraisal_calibration_evidence',
        'issue_reports',
        'issue_status_histories',
        'appraisal_milestone_reminders',
        'notifications',
        'audit_trails',
    ];

    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default('active')->index();
            $table->string('timezone')->default('UTC');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->string('timezone')->nullable();
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city')->nullable();
            $table->string('state_province')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'code']);
            $table->unique(['organization_id', 'name']);
        });

        Schema::create('organization_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('invited')->index();
            $table->boolean('is_default')->default(false);
            $table->boolean('access_all_locations')->default(false);
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('location_user', function (Blueprint $table) {
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['location_id', 'user_id']);
        });

        Schema::create('organization_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('legal_name')->nullable();
            $table->string('registration_number')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city')->nullable();
            $table->string('state_province')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->text('report_footer')->nullable();
            $table->string('mail_from_name')->nullable();
            $table->string('mail_reply_to_address')->nullable();
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_platform_admin')->default(false)->after('is_approved')->index();
        });

        $organizationId = $this->createInitialOrganization();
        $locationId = $this->createInitialLocation($organizationId);

        foreach ($this->tenantTables as $tableName) {
            if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'organization_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($organizationId) {
                $table->unsignedBigInteger('organization_id')->nullable()->default($organizationId)->index();
            });

            DB::table($tableName)->whereNull('organization_id')->update(['organization_id' => $organizationId]);
        }

        if (Schema::hasTable('employee_profiles') && ! Schema::hasColumn('employee_profiles', 'location_id')) {
            Schema::table('employee_profiles', function (Blueprint $table) {
                $table->foreignId('location_id')->nullable()->after('department_id')->constrained()->nullOnDelete();
            });

            DB::table('employee_profiles')->whereNull('location_id')->update(['location_id' => $locationId]);
        }

        $this->backfillMemberships($organizationId);
        $this->migrateOrganizationSettings($organizationId);
        $this->migrateTenantFiles($organizationId);
        $this->enablePermissionTeams($organizationId);
        $this->promoteExistingSuperAdmins();
        $this->replaceTenantUniqueIndexes();
        $this->hardenTenantColumns();
    }

    private function createInitialOrganization(): int
    {
        $settings = Schema::hasTable('system_settings') ? DB::table('system_settings')->first() : null;
        $name = filled($settings?->company_name ?? null)
            ? (string) $settings->company_name
            : (string) config('app.name', 'Performance Appraisal');

        return (int) DB::table('organizations')->insertGetId([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'status' => 'active',
            'timezone' => (string) config('app.timezone', 'UTC'),
            'email' => $settings?->company_email ?? null,
            'phone' => $settings?->company_phone ?? null,
            'website' => $settings?->company_website ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createInitialLocation(int $organizationId): int
    {
        return (int) DB::table('locations')->insertGetId([
            'organization_id' => $organizationId,
            'name' => 'Main Location',
            'code' => 'MAIN',
            'timezone' => (string) config('app.timezone', 'UTC'),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function backfillMemberships(int $organizationId): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        DB::table('users')->orderBy('id')->each(function (object $user) use ($organizationId) {
            $active = (bool) ($user->is_approved ?? true);

            DB::table('organization_memberships')->updateOrInsert(
                ['organization_id' => $organizationId, 'user_id' => $user->id],
                [
                    'status' => $active ? 'active' : 'invited',
                    'is_default' => true,
                    'access_all_locations' => $active,
                    'invited_at' => now(),
                    'activated_at' => $active ? now() : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        });
    }

    private function migrateOrganizationSettings(int $organizationId): void
    {
        $settings = Schema::hasTable('system_settings') ? DB::table('system_settings')->first() : null;

        DB::table('organization_settings')->insert([
            'organization_id' => $organizationId,
            'legal_name' => $settings?->company_legal_name ?? null,
            'registration_number' => $settings?->company_registration_number ?? null,
            'tax_number' => $settings?->company_tax_number ?? null,
            'address_line_1' => $settings?->address_line_1 ?? null,
            'address_line_2' => $settings?->address_line_2 ?? null,
            'city' => $settings?->city ?? null,
            'state_province' => $settings?->state_province ?? null,
            'postal_code' => $settings?->postal_code ?? null,
            'country' => $settings?->country ?? null,
            'report_footer' => $settings?->report_footer ?? null,
            'mail_from_name' => $settings?->mail_from_name ?? null,
            'mail_reply_to_address' => $settings?->mail_reply_to_address ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function migrateTenantFiles(int $organizationId): void
    {
        $legacyLogos = glob(public_path('branding/system-logo.*')) ?: [];

        if ($legacyLogos !== []) {
            $legacyLogo = $legacyLogos[0];
            $extension = pathinfo($legacyLogo, PATHINFO_EXTENSION) ?: 'png';
            $relativePath = "branding/organizations/{$organizationId}/logo.{$extension}";
            $destination = public_path($relativePath);

            File::ensureDirectoryExists(dirname($destination));
            if (! File::copy($legacyLogo, $destination)) {
                throw new RuntimeException("Unable to copy legacy tenant logo to {$destination}.");
            }
            DB::table('organization_settings')
                ->where('organization_id', $organizationId)
                ->update(['logo_path' => $relativePath, 'updated_at' => now()]);
        }

        $this->copyEvidenceIntoTenantPath(
            'appraisal_objective_evidence',
            'performance/evidence/',
            "organizations/{$organizationId}/performance/evidence",
        );
        $this->copyEvidenceIntoTenantPath(
            'appraisal_calibration_evidence',
            'performance/calibration-evidence/',
            "organizations/{$organizationId}/performance/calibration-evidence",
        );
    }

    private function copyEvidenceIntoTenantPath(string $table, string $legacyPrefix, string $tenantPrefix): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'path')) {
            return;
        }

        DB::table($table)
            ->whereNotNull('path')
            ->where('path', 'not like', 'organizations/%')
            ->orderBy('id')
            ->each(function (object $evidence) use ($table, $legacyPrefix, $tenantPrefix) {
                $diskName = filled($evidence->disk ?? null) ? (string) $evidence->disk : 'local';
                $disk = Storage::disk($diskName);
                $source = ltrim((string) $evidence->path, '/');

                if (! $disk->exists($source)) {
                    return;
                }

                $relativePath = str_starts_with($source, $legacyPrefix)
                    ? substr($source, strlen($legacyPrefix))
                    : basename($source);
                $destination = $tenantPrefix.'/'.ltrim($relativePath, '/');

                if (! $disk->exists($destination)) {
                    if (! $disk->copy($source, $destination)) {
                        throw new RuntimeException("Unable to copy tenant evidence from {$source} to {$destination}.");
                    }
                }

                DB::table($table)->where('id', $evidence->id)->update([
                    'path' => $destination,
                    'disk' => $diskName,
                    'updated_at' => now(),
                ]);
            });
    }

    private function enablePermissionTeams(int $organizationId): void
    {
        foreach (['roles', 'model_has_roles', 'model_has_permissions'] as $tableName) {
            if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'organization_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName, $organizationId) {
                $column = $tableName === 'roles'
                    ? $table->unsignedBigInteger('organization_id')->nullable()->default($organizationId)
                    : $table->unsignedBigInteger('organization_id')->default($organizationId);
                $column->index();
            });
        }

        foreach (['roles', 'model_has_roles', 'model_has_permissions'] as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'organization_id')) {
                DB::table($tableName)->whereNull('organization_id')->update(['organization_id' => $organizationId]);
            }
        }

        // Existing non-team Spatie installations have primary keys that would
        // prevent the same global permission from being assigned in two tenants.
        if (DB::getDriverName() === 'mysql') {
            foreach (['model_has_roles' => 'role_id', 'model_has_permissions' => 'permission_id'] as $tableName => $key) {
                try {
                    DB::statement("ALTER TABLE `{$tableName}` DROP PRIMARY KEY, ADD PRIMARY KEY (`organization_id`, `{$key}`, `model_id`, `model_type`)");
                } catch (Throwable) {
                    // Fresh team-aware installations already have the desired key.
                }
            }
        }

        try {
            Schema::table('roles', fn (Blueprint $table) => $table->dropUnique('roles_name_guard_name_unique'));
        } catch (Throwable) {
            // Fresh installations already use the team-aware unique key.
        }

        try {
            Schema::table('roles', fn (Blueprint $table) => $table->unique(
                ['organization_id', 'name', 'guard_name'],
                'roles_organization_id_name_guard_name_unique',
            ));
        } catch (Throwable) {
            // The team-aware unique key already exists.
        }
    }

    private function promoteExistingSuperAdmins(): void
    {
        if (! Schema::hasTable('roles') || ! Schema::hasTable('model_has_roles')) {
            return;
        }

        $superAdminRoleIds = DB::table('roles')->where('name', 'Super Admin')->pluck('id');
        $userIds = DB::table('model_has_roles')
            ->whereIn('role_id', $superAdminRoleIds)
            ->where('model_type', User::class)
            ->pluck('model_id');

        DB::table('users')->whereIn('id', $userIds)->update(['is_platform_admin' => true]);
    }

    private function replaceTenantUniqueIndexes(): void
    {
        $replacements = [
            'departments' => [['name'], ['code']],
            'job_titles' => [['name'], ['code']],
            'review_cycles' => [['name'], ['code']],
            'perspectives' => [['name'], ['code']],
            'competencies' => [['name'], ['code']],
            'appraisal_templates' => [['name', 'version'], ['code', 'version']],
            'employee_profiles' => [['user_id'], ['employee_number'], ['national_id']],
        ];

        foreach ($replacements as $tableName => $keys) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'organization_id')) {
                continue;
            }

            foreach ($keys as $columns) {
                $oldName = $tableName.'_'.implode('_', $columns).'_unique';
                $newColumns = array_merge(['organization_id'], $columns);
                $newName = $tableName.'_'.implode('_', $newColumns).'_unique';

                try {
                    Schema::table($tableName, fn (Blueprint $table) => $table->dropUnique($oldName));
                } catch (Throwable) {
                    // The index may already have been converted on an earlier deployment.
                }

                try {
                    Schema::table($tableName, fn (Blueprint $table) => $table->unique($newColumns, $newName));
                } catch (Throwable) {
                    // Keep the migration idempotent across supported database drivers.
                }
            }
        }
    }

    private function hardenTenantColumns(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->tenantTables as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'organization_id')) {
                continue;
            }

            DB::statement("ALTER TABLE `{$tableName}` MODIFY `organization_id` BIGINT UNSIGNED NOT NULL");
        }
    }

    public function down(): void
    {
        foreach (array_reverse($this->tenantTables) as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'organization_id')) {
                Schema::table($tableName, fn (Blueprint $table) => $table->dropColumn('organization_id'));
            }
        }

        if (Schema::hasTable('employee_profiles') && Schema::hasColumn('employee_profiles', 'location_id')) {
            Schema::table('employee_profiles', fn (Blueprint $table) => $table->dropConstrainedForeignId('location_id'));
        }

        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('is_platform_admin'));
        Schema::dropIfExists('organization_settings');
        Schema::dropIfExists('location_user');
        Schema::dropIfExists('organization_memberships');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('organizations');
    }
};
