<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('employee_profiles')) {
            return;
        }

        if (! $this->indexExists('employee_profiles', 'employee_profiles_user_id_unique')) {
            return;
        }

        if ($this->foreignKeyExists('employee_profiles', 'user_id')) {
            Schema::table('employee_profiles', function (Blueprint $table): void {
                $table->dropForeign(['user_id']);
            });
        }

        Schema::table('employee_profiles', function (Blueprint $table): void {
            $table->dropUnique('employee_profiles_user_id_unique');
        });

        if (! $this->indexExists('employee_profiles', 'employee_profiles_user_id_index')) {
            Schema::table('employee_profiles', function (Blueprint $table): void {
                $table->index('user_id');
            });
        }

        if (! $this->foreignKeyExists('employee_profiles', 'user_id')) {
            Schema::table('employee_profiles', function (Blueprint $table): void {
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }

        if (! $this->indexExists('employee_profiles', 'employee_profiles_organization_id_user_id_unique')
            && Schema::hasColumn('employee_profiles', 'organization_id')) {
            Schema::table('employee_profiles', function (Blueprint $table): void {
                $table->unique(
                    ['organization_id', 'user_id'],
                    'employee_profiles_organization_id_user_id_unique',
                );
            });
        }
    }

    private function indexExists(string $table, string $index): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            foreach (DB::select("PRAGMA index_list('{$table}')") as $indexRow) {
                if (($indexRow->name ?? null) === $index) {
                    return true;
                }
            }

            return false;
        }

        $database = Schema::getConnection()->getDatabaseName();

        return DB::table('information_schema.statistics')
            ->where('table_schema', $database)
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }

    private function foreignKeyExists(string $table, string $column): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            foreach (DB::select("PRAGMA foreign_key_list('{$table}')") as $foreignKey) {
                if (($foreignKey->from ?? null) === $column) {
                    return true;
                }
            }

            return false;
        }

        $database = Schema::getConnection()->getDatabaseName();

        return DB::table('information_schema.key_column_usage')
            ->where('table_schema', $database)
            ->where('table_name', $table)
            ->where('column_name', $column)
            ->whereNotNull('referenced_table_name')
            ->exists();
    }

    public function down(): void
    {
        // Intentionally left blank.
    }
};
