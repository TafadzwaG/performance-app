<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appraisals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_cycle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')->constrained('appraisal_templates')->restrictOnDelete();
            $table->foreignId('employee_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('line_manager_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approving_manager_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('draft')->index();
            $table->string('reopened_stage')->nullable();
            $table->unsignedTinyInteger('business_weight_percent')->default(80);
            $table->unsignedTinyInteger('values_weight_percent')->default(20);
            $table->decimal('business_score', 6, 2)->nullable();
            $table->decimal('values_score', 6, 2)->nullable();
            $table->decimal('overall_score', 6, 2)->nullable();
            $table->foreignId('overall_rating_scale_level_id')->nullable()->constrained('rating_scale_levels')->nullOnDelete();
            $table->timestamp('goal_submitted_at')->nullable();
            $table->timestamp('self_assessment_submitted_at')->nullable();
            $table->timestamp('manager_reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->string('employee_name_snapshot');
            $table->string('employee_email_snapshot');
            $table->string('employee_number_snapshot');
            $table->string('department_name_snapshot')->nullable();
            $table->string('job_title_name_snapshot')->nullable();
            $table->string('cycle_name_snapshot');
            $table->string('template_name_snapshot');
            $table->timestamps();

            $table->unique(['review_cycle_id', 'employee_profile_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appraisals');
    }
};
