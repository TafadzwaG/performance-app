<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appraisal_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code');
            $table->unsignedInteger('version')->default(1);
            $table->text('description')->nullable();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('job_title_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('objective_rating_scale_id')->constrained('rating_scales')->restrictOnDelete();
            $table->foreignId('competency_rating_scale_id')->constrained('rating_scales')->restrictOnDelete();
            $table->foreignId('overall_rating_scale_id')->constrained('rating_scales')->restrictOnDelete();
            $table->unsignedTinyInteger('business_weight_percent')->default(80);
            $table->unsignedTinyInteger('values_weight_percent')->default(20);
            $table->unsignedTinyInteger('min_objectives')->default(4);
            $table->unsignedTinyInteger('max_objectives')->default(6);
            $table->boolean('allow_competencies')->default(true);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['code', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appraisal_templates');
    }
};
