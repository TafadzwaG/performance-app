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
        Schema::create('appraisal_competency_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('competency_id')->constrained()->restrictOnDelete();
            $table->foreignId('self_rating_scale_level_id')->nullable();
            $table->foreign('self_rating_scale_level_id', 'acr_self_scale_level_fk')->references('id')->on('rating_scale_levels')->nullOnDelete();
            $table->decimal('self_rating_score', 8, 2)->nullable();
            $table->foreignId('manager_rating_scale_level_id')->nullable();
            $table->foreign('manager_rating_scale_level_id', 'acr_manager_scale_level_fk')->references('id')->on('rating_scale_levels')->nullOnDelete();
            $table->decimal('manager_rating_score', 8, 2)->nullable();
            $table->longText('employee_comment')->nullable();
            $table->longText('manager_comment')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['appraisal_id', 'competency_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appraisal_competency_ratings');
    }
};
