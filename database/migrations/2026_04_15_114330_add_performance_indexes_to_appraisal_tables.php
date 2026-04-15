<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appraisals', function (Blueprint $table) {
            $table->index(['status', 'review_cycle_id'], 'appraisals_status_cycle_idx');
        });

        Schema::table('appraisal_competency_ratings', function (Blueprint $table) {
            $table->index(
                ['appraisal_id', 'manager_rating_scale_level_id'],
                'acr_appraisal_manager_level_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('appraisals', function (Blueprint $table) {
            $table->dropIndex('appraisals_status_cycle_idx');
        });

        Schema::table('appraisal_competency_ratings', function (Blueprint $table) {
            $table->dropIndex('acr_appraisal_manager_level_idx');
        });
    }
};
