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
        Schema::create('review_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->date('start_date')->index();
            $table->date('end_date')->index();
            $table->date('goal_setting_deadline')->nullable();
            $table->date('self_assessment_deadline')->nullable();
            $table->date('manager_review_deadline')->nullable();
            $table->date('approval_deadline')->nullable();
            $table->string('status')->default('draft')->index();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('review_cycles');
    }
};
