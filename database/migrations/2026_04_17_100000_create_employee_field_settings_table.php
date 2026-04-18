<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_field_settings', function (Blueprint $table) {
            $table->id();
            $table->string('screen_key', 100);
            $table->string('field_key', 100);
            $table->boolean('is_enabled')->default(true);
            $table->boolean('is_required')->default(false);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->unique(['screen_key', 'field_key']);
            $table->index(['screen_key', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_field_settings');
    }
};
