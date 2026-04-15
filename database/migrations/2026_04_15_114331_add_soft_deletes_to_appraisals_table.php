<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appraisals', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Rebuild the (review_cycle_id, employee_profile_id) unique so that
        // soft-deleted rows do not block new assignments for the same pair.
        // On MySQL, NULL values are treated as distinct in unique indexes,
        // so including deleted_at yields the desired "unique among live rows".
        Schema::table('appraisals', function (Blueprint $table) {
            $table->dropUnique(['review_cycle_id', 'employee_profile_id']);
            $table->unique(
                ['review_cycle_id', 'employee_profile_id', 'deleted_at'],
                'appraisals_cycle_profile_deleted_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('appraisals', function (Blueprint $table) {
            $table->dropUnique('appraisals_cycle_profile_deleted_unique');
            $table->unique(['review_cycle_id', 'employee_profile_id']);
        });

        Schema::table('appraisals', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
