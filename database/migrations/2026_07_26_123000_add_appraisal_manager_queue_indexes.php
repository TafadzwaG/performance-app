<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appraisals', function (Blueprint $table): void {
            $table->index(
                ['organization_id', 'employee_user_id', 'status', 'reopened_stage', 'deleted_at'],
                'appraisals_employee_queue_idx',
            );
            $table->index(
                ['organization_id', 'line_manager_user_id', 'status', 'reopened_stage', 'deleted_at'],
                'appraisals_manager_queue_idx',
            );
            $table->index(
                ['organization_id', 'approving_manager_user_id', 'status', 'reopened_stage', 'deleted_at'],
                'appraisals_approver_queue_idx',
            );
            $table->index(
                ['organization_id', 'updated_at', 'deleted_at'],
                'appraisals_tenant_updated_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::table('appraisals', function (Blueprint $table): void {
            $table->dropIndex('appraisals_employee_queue_idx');
            $table->dropIndex('appraisals_manager_queue_idx');
            $table->dropIndex('appraisals_approver_queue_idx');
            $table->dropIndex('appraisals_tenant_updated_idx');
        });
    }
};
