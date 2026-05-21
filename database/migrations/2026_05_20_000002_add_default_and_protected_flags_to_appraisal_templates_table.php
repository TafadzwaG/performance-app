<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appraisal_templates', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->index()->after('allow_competencies');
            $table->boolean('is_protected')->default(false)->index()->after('is_default');
        });
    }

    public function down(): void
    {
        Schema::table('appraisal_templates', function (Blueprint $table) {
            $table->dropColumn(['is_default', 'is_protected']);
        });
    }
};
