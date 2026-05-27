<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appraisal_milestone_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_id')->constrained()->cascadeOnDelete();
            $table->string('milestone', 40);
            $table->unsignedTinyInteger('days_before');
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->unique(['appraisal_id', 'milestone', 'days_before'], 'appraisal_milestone_reminder_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appraisal_milestone_reminders');
    }
};
