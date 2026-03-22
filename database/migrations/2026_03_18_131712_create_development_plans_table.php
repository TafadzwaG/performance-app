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
        Schema::create('development_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_id')->unique()->constrained()->cascadeOnDelete();
            $table->longText('strengths')->nullable();
            $table->longText('improvement_areas')->nullable();
            $table->longText('follow_up_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('development_plans');
    }
};
