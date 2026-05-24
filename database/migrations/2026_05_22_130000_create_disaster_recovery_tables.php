<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $createdRestoreTestsTable = false;

        if (! Schema::hasTable('disaster_recovery_backups')) {
            Schema::create('disaster_recovery_backups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('created_by_user_id')->nullable();
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
                $table->foreign('created_by_user_id', 'dr_backups_created_by_fk')->references('id')->on('users')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('disaster_recovery_restore_requests')) {
            Schema::create('disaster_recovery_restore_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('disaster_recovery_backup_id');
                $table->foreignId('pre_restore_backup_id')->nullable();
                $table->foreignId('requested_by_user_id');
                $table->foreignId('approved_by_user_id')->nullable();
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
                $table->foreign('disaster_recovery_backup_id', 'dr_restore_requests_backup_fk')->references('id')->on('disaster_recovery_backups')->cascadeOnDelete();
                $table->foreign('pre_restore_backup_id', 'dr_restore_requests_pre_backup_fk')->references('id')->on('disaster_recovery_backups')->nullOnDelete();
                $table->foreign('requested_by_user_id', 'dr_restore_requests_requested_by_fk')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('approved_by_user_id', 'dr_restore_requests_approved_by_fk')->references('id')->on('users')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('disaster_recovery_restore_tests')) {
            Schema::create('disaster_recovery_restore_tests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('disaster_recovery_backup_id')->nullable();
                $table->string('status')->index();
                $table->string('database_verification_status')->nullable();
                $table->string('file_verification_status')->nullable();
                $table->json('details')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
                $table->foreign('disaster_recovery_backup_id', 'dr_restore_tests_backup_fk')->references('id')->on('disaster_recovery_backups')->nullOnDelete();
            });

            $createdRestoreTestsTable = true;
        }

        if (! $createdRestoreTestsTable && ! $this->foreignKeyExists('disaster_recovery_restore_tests', 'dr_restore_tests_backup_fk')) {
            Schema::table('disaster_recovery_restore_tests', function (Blueprint $table) {
                $table->foreign('disaster_recovery_backup_id', 'dr_restore_tests_backup_fk')->references('id')->on('disaster_recovery_backups')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('disaster_recovery_restore_tests');
        Schema::dropIfExists('disaster_recovery_restore_requests');
        Schema::dropIfExists('disaster_recovery_backups');
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return false;
        }

        return DB::selectOne(
            'select 1 from information_schema.table_constraints where constraint_schema = database() and table_name = ? and constraint_name = ? and constraint_type = "FOREIGN KEY" limit 1',
            [$table, $constraint],
        ) !== null;
    }
};
