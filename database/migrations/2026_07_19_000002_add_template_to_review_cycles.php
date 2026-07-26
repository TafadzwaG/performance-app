<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('review_cycles', function (Blueprint $table) {
            $table->foreignId('template_id')
                ->nullable()
                ->after('approval_deadline')
                ->constrained('appraisal_templates')
                ->restrictOnDelete();
        });

        DB::table('review_cycles')->orderBy('id')->each(function (object $cycle): void {
            $templateIds = DB::table('appraisals')
                ->where('review_cycle_id', $cycle->id)
                ->whereNull('deleted_at')
                ->distinct()
                ->pluck('template_id')
                ->filter()
                ->values();

            if ($templateIds->count() === 1) {
                DB::table('review_cycles')
                    ->where('id', $cycle->id)
                    ->update(['template_id' => $templateIds->first()]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('review_cycles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('template_id');
        });
    }
};
