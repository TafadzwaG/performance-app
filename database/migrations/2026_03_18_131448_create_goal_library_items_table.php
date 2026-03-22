<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goal_library_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('job_title_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('perspective_id')->constrained()->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('kpi_measure')->nullable();
            $table->text('target_definition')->nullable();
            $table->decimal('default_weight', 5, 2)->nullable();
            $table->text('evidence_source')->nullable();
            $table->unsignedInteger('timeline_days')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goal_library_items');
    }
};
