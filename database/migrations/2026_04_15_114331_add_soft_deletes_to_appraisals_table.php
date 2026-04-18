<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add deleted_at if it isn't already there (idempotent — MySQL DDL
        //    auto-commits, so a previous failed run may have already added it).
        if (! Schema::hasColumn('appraisals', 'deleted_at')) {
            Schema::table('appraisals', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        $indexes = $this->existingIndexes();

        // 2. Ensure standalone indexes exist on the FK columns. Without these,
        //    MySQL refuses to drop the composite unique because the foreign
        //    keys on review_cycle_id / employee_profile_id rely on it.
        Schema::table('appraisals', function (Blueprint $table) use ($indexes) {
            if (! $indexes->contains('appraisals_review_cycle_id_index')) {
                $table->index('review_cycle_id');
            }
            if (! $indexes->contains('appraisals_employee_profile_id_index')) {
                $table->index('employee_profile_id');
            }
        });

        // 3. Drop the old (review_cycle_id, employee_profile_id) unique.
        if ($indexes->contains('appraisals_review_cycle_id_employee_profile_id_unique')) {
            Schema::table('appraisals', function (Blueprint $table) {
                $table->dropUnique(['review_cycle_id', 'employee_profile_id']);
            });
        }

        // 4. Recreate it with deleted_at so soft-deleted rows do not block new
        //    assignments. MySQL treats NULL as distinct in unique indexes, so
        //    only one live (deleted_at IS NULL) row per (cycle, profile) pair.
        $indexes = $this->existingIndexes();
        if (! $indexes->contains('appraisals_cycle_profile_deleted_unique')) {
            Schema::table('appraisals', function (Blueprint $table) {
                $table->unique(
                    ['review_cycle_id', 'employee_profile_id', 'deleted_at'],
                    'appraisals_cycle_profile_deleted_unique'
                );
            });
        }
    }

    public function down(): void
    {
        $indexes = $this->existingIndexes();

        if ($indexes->contains('appraisals_cycle_profile_deleted_unique')) {
            Schema::table('appraisals', function (Blueprint $table) {
                $table->dropUnique('appraisals_cycle_profile_deleted_unique');
            });
        }

        if (! $indexes->contains('appraisals_review_cycle_id_employee_profile_id_unique')) {
            Schema::table('appraisals', function (Blueprint $table) {
                $table->unique(['review_cycle_id', 'employee_profile_id']);
            });
        }

        if (Schema::hasColumn('appraisals', 'deleted_at')) {
            Schema::table('appraisals', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }

    private function existingIndexes(): \Illuminate\Support\Collection
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            return collect(DB::select("PRAGMA index_list('appraisals')"))
                ->pluck('name')
                ->unique()
                ->values();
        }

        return collect(DB::select('SHOW INDEX FROM appraisals'))
            ->pluck('Key_name')
            ->unique()
            ->values();
    }
};
