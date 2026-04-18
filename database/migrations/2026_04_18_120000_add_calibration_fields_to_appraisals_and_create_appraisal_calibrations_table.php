<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appraisals', function (Blueprint $table) {
            if (! Schema::hasColumn('appraisals', 'calibrated_overall_score')) {
                $table->decimal('calibrated_overall_score', 6, 2)->nullable()->after('overall_score');
            }

            if (! Schema::hasColumn('appraisals', 'calibrated_overall_rating_scale_level_id')) {
                $table->unsignedBigInteger('calibrated_overall_rating_scale_level_id')->nullable()->after('overall_rating_scale_level_id');
                $table->foreign('calibrated_overall_rating_scale_level_id', 'appraisals_calibrated_rating_fk')
                    ->references('id')
                    ->on('rating_scale_levels')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('appraisals', 'calibration_comment')) {
                $table->text('calibration_comment')->nullable()->after('approved_at');
            }

            if (! Schema::hasColumn('appraisals', 'calibrated_at')) {
                $table->timestamp('calibrated_at')->nullable()->after('approved_at');
            }

            if (! Schema::hasColumn('appraisals', 'calibrated_by_user_id')) {
                $table->unsignedBigInteger('calibrated_by_user_id')->nullable()->after('calibrated_at');
                $table->foreign('calibrated_by_user_id', 'appraisals_calibrated_by_fk')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();
            }
        });

        if (! Schema::hasTable('appraisal_calibrations')) {
            Schema::create('appraisal_calibrations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('appraisal_id');
                $table->unsignedBigInteger('actor_user_id');
                $table->string('decision');
                $table->decimal('original_overall_score', 6, 2)->nullable();
                $table->unsignedBigInteger('original_overall_rating_scale_level_id')->nullable();
                $table->decimal('calibrated_overall_score', 6, 2)->nullable();
                $table->unsignedBigInteger('calibrated_overall_rating_scale_level_id')->nullable();
                $table->text('comments');
                $table->text('evidence_summary')->nullable();
                $table->timestamps();

                $table->foreign('appraisal_id', 'appr_calib_appraisal_fk')->references('id')->on('appraisals')->cascadeOnDelete();
                $table->foreign('actor_user_id', 'appr_calib_actor_fk')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('original_overall_rating_scale_level_id', 'appr_calib_orig_rating_fk')
                    ->references('id')
                    ->on('rating_scale_levels')
                    ->nullOnDelete();
                $table->foreign('calibrated_overall_rating_scale_level_id', 'appr_calib_cal_rating_fk')
                    ->references('id')
                    ->on('rating_scale_levels')
                    ->nullOnDelete();

                $table->index(['appraisal_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('appraisal_calibrations');

        Schema::table('appraisals', function (Blueprint $table) {
            if (Schema::hasColumn('appraisals', 'calibrated_by_user_id')) {
                $table->dropForeign('appraisals_calibrated_by_fk');
                $table->dropColumn('calibrated_by_user_id');
            }

            if (Schema::hasColumn('appraisals', 'calibrated_at')) {
                $table->dropColumn('calibrated_at');
            }

            if (Schema::hasColumn('appraisals', 'calibration_comment')) {
                $table->dropColumn('calibration_comment');
            }

            if (Schema::hasColumn('appraisals', 'calibrated_overall_rating_scale_level_id')) {
                $table->dropForeign('appraisals_calibrated_rating_fk');
                $table->dropColumn('calibrated_overall_rating_scale_level_id');
            }

            if (Schema::hasColumn('appraisals', 'calibrated_overall_score')) {
                $table->dropColumn('calibrated_overall_score');
            }
        });
    }
};
