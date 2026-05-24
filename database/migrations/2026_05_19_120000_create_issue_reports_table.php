<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issue_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assignee_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type')->index();
            $table->string('title');
            $table->text('description');
            $table->string('status')->default('pending')->index();
            $table->timestamps();

            $table->index(['reporter_user_id', 'status']);
            $table->index(['assignee_user_id', 'status']);
        });

        Schema::create('issue_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_report_id')->constrained('issue_reports')->cascadeOnDelete();
            $table->foreignId('actor_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status')->nullable();
            $table->foreignId('from_assignee_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('to_assignee_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['issue_report_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_status_histories');
        Schema::dropIfExists('issue_reports');
    }
};
