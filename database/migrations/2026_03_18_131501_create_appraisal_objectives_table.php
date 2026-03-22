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
        Schema::create('appraisal_objectives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_item_id')->nullable()->constrained('appraisal_template_items')->nullOnDelete();
            $table->foreignId('goal_library_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('perspective_id')->constrained()->restrictOnDelete();
            $table->string('objective_type')->default('business')->index();
            $table->string('title');
            $table->text('kpi_measure')->nullable();
            $table->text('target_definition')->nullable();
            $table->decimal('weight', 5, 2)->default(0);
            $table->text('evidence_source')->nullable();
            $table->date('due_date')->nullable();
            $table->longText('performance_achieved')->nullable();
            $table->longText('employee_comment')->nullable();
            $table->longText('manager_comment')->nullable();
            $table->foreignId('self_rating_scale_level_id')->nullable()->constrained('rating_scale_levels')->nullOnDelete();
            $table->decimal('self_rating_score', 8, 2)->nullable();
            $table->foreignId('manager_rating_scale_level_id')->nullable()->constrained('rating_scale_levels')->nullOnDelete();
            $table->decimal('manager_rating_score', 8, 2)->nullable();
            $table->boolean('include_in_business_score')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['appraisal_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appraisal_objectives');
    }
};
