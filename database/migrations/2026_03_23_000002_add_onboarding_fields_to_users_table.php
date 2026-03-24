<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('force_password_change')->default(false)->after('password');
            $table->timestamp('password_changed_at')->nullable()->after('force_password_change');
            $table->timestamp('welcome_notification_sent_at')->nullable()->after('password_changed_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'force_password_change',
                'password_changed_at',
                'welcome_notification_sent_at',
            ]);
        });
    }
};
