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
        Schema::create('appraisal_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appraisal_objective_id')->nullable()->constrained('appraisal_objectives')->nullOnDelete();
            $table->foreignId('author_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('comment_type')->index();
            $table->longText('body');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appraisal_comments');
    }
};
