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
        Schema::create('rating_scale_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rating_scale_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('short_label')->nullable();
            $table->decimal('value', 8, 2);
            $table->decimal('min_percent', 5, 2)->nullable();
            $table->decimal('max_percent', 5, 2)->nullable();
            $table->string('color')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['rating_scale_id', 'value']);
            $table->unique(['rating_scale_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rating_scale_levels');
    }
};
