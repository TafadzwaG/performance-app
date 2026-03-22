<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appraisal_template_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appraisal_template_id')->constrained()->cascadeOnDelete();
            $table->string('item_type')->index();
            $table->foreignId('perspective_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('competency_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('default_weight', 5, 2)->nullable();
            $table->text('evidence_source_hint')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->timestamps();

            $table->unique(['appraisal_template_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appraisal_template_items');
    }
};
