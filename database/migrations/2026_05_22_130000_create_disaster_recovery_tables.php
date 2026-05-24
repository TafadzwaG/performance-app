<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disaster_recovery_backups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('trigger')->index();
            $table->string('status')->index();
            $table->string('disk')->nullable();
            $table->string('path')->nullable();
            $table->string('filename')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('checksum', 128)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('disaster_recovery_restore_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('disaster_recovery_backup_id')->constrained('disaster_recovery_backups')->cascadeOnDelete();
            $table->foreignId('pre_restore_backup_id')->nullable()->constrained('disaster_recovery_backups')->nullOnDelete();
            $table->foreignId('requested_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->index();
            $table->string('confirmation_phrase')->nullable();
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('disaster_recovery_restore_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('disaster_recovery_backup_id')->nullable()->constrained('disaster_recovery_backups')->nullOnDelete();
            $table->string('status')->index();
            $table->string('database_verification_status')->nullable();
            $table->string('file_verification_status')->nullable();
            $table->json('details')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disaster_recovery_restore_tests');
        Schema::dropIfExists('disaster_recovery_restore_requests');
        Schema::dropIfExists('disaster_recovery_backups');
    }
};
