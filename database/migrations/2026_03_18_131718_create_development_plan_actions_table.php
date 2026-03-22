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
        Schema::create('development_plan_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('development_plan_id')->constrained()->cascadeOnDelete();
            $table->string('action');
            $table->foreignId('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_date')->nullable()->index();
            $table->string('status')->default('pending')->index();
            $table->string('follow_up_status')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('development_plan_actions');
    }
};
