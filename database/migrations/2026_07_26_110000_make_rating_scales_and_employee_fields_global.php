<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var array<string, list<string>> */
    private const RATING_SCALE_REFERENCES = [
        'appraisal_templates' => [
            'objective_rating_scale_id',
            'competency_rating_scale_id',
            'overall_rating_scale_id',
        ],
    ];

    /** @var array<string, list<string>> */
    private const RATING_LEVEL_REFERENCES = [
        'appraisals' => [
            'overall_rating_scale_level_id',
            'calibrated_overall_rating_scale_level_id',
        ],
        'appraisal_objectives' => [
            'self_rating_scale_level_id',
            'manager_rating_scale_level_id',
        ],
        'appraisal_competency_ratings' => [
            'self_rating_scale_level_id',
            'manager_rating_scale_level_id',
        ],
        'appraisal_calibrations' => [
            'original_overall_rating_scale_level_id',
            'calibrated_overall_rating_scale_level_id',
        ],
    ];

    public function up(): void
    {
        $this->makeRatingScalesGlobal();
        $this->makeEmployeeFieldSettingsGlobal();
    }

    public function down(): void
    {
        $organizationId = DB::table('organizations')->orderBy('id')->value('id');

        if (Schema::hasTable('rating_scales') && ! Schema::hasColumn('rating_scales', 'organization_id')) {
            $this->dropIndexIfExists('rating_scales', 'rating_scales_name_unique');
            $this->dropIndexIfExists('rating_scales', 'rating_scales_code_unique');

            Schema::table('rating_scales', function (Blueprint $table): void {
                $table->unsignedBigInteger('organization_id')->nullable()->index();
            });

            DB::table('rating_scales')->update(['organization_id' => $organizationId]);

            Schema::table('rating_scales', function (Blueprint $table): void {
                $table->unique(['organization_id', 'name']);
                $table->unique(['organization_id', 'code']);
            });
        }

        if (Schema::hasTable('rating_scale_levels') && ! Schema::hasColumn('rating_scale_levels', 'organization_id')) {
            Schema::table('rating_scale_levels', function (Blueprint $table): void {
                $table->unsignedBigInteger('organization_id')->nullable()->index();
            });

            DB::table('rating_scale_levels')->update(['organization_id' => $organizationId]);
        }

        if (Schema::hasTable('employee_field_settings') && ! Schema::hasColumn('employee_field_settings', 'organization_id')) {
            $this->dropIndexIfExists(
                'employee_field_settings',
                'employee_field_settings_screen_key_field_key_unique',
            );

            Schema::table('employee_field_settings', function (Blueprint $table): void {
                $table->unsignedBigInteger('organization_id')->nullable()->index();
            });

            DB::table('employee_field_settings')->update(['organization_id' => $organizationId]);

            Schema::table('employee_field_settings', function (Blueprint $table): void {
                $table->unique(['organization_id', 'screen_key', 'field_key']);
            });
        }
    }

    private function makeRatingScalesGlobal(): void
    {
        if (! Schema::hasTable('rating_scales')
            || ! Schema::hasColumn('rating_scales', 'organization_id')) {
            return;
        }

        $this->consolidateRatingScales();
        $this->makeScaleNamesUnique();

        $this->dropIndexIfExists('rating_scales', 'rating_scales_organization_id_name_unique');
        $this->dropIndexIfExists('rating_scales', 'rating_scales_organization_id_code_unique');
        $this->dropIndexIfExists('rating_scales', 'rating_scales_organization_id_index');

        if (Schema::hasTable('rating_scale_levels')
            && Schema::hasColumn('rating_scale_levels', 'organization_id')) {
            $this->dropIndexIfExists(
                'rating_scale_levels',
                'rating_scale_levels_organization_id_index',
            );

            Schema::table('rating_scale_levels', function (Blueprint $table): void {
                $table->dropColumn('organization_id');
            });
        }

        Schema::table('rating_scales', function (Blueprint $table): void {
            $table->dropColumn('organization_id');
        });

        Schema::table('rating_scales', function (Blueprint $table): void {
            $table->unique('name');
            $table->unique('code');
        });
    }

    private function consolidateRatingScales(): void
    {
        $duplicateCodes = DB::table('rating_scales')
            ->select('code')
            ->groupBy('code')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('code');

        foreach ($duplicateCodes as $code) {
            $scales = DB::table('rating_scales')
                ->where('code', $code)
                ->orderBy('id')
                ->get()
                ->map(function (object $scale): object {
                    $scale->level_count = DB::table('rating_scale_levels')
                        ->where('rating_scale_id', $scale->id)
                        ->count();

                    return $scale;
                })
                ->sort(function (object $left, object $right): int {
                    if ($left->level_count !== $right->level_count) {
                        return $right->level_count <=> $left->level_count;
                    }

                    $leftIsActive = $left->deleted_at === null;
                    $rightIsActive = $right->deleted_at === null;

                    if ($leftIsActive !== $rightIsActive) {
                        return $rightIsActive <=> $leftIsActive;
                    }

                    return $left->id <=> $right->id;
                })
                ->values();

            $canonicalScale = $scales->first();

            foreach ($scales->skip(1) as $duplicateScale) {
                $this->mergeRatingScaleLevels($duplicateScale->id, $canonicalScale->id);
                $this->remapReferences(
                    self::RATING_SCALE_REFERENCES,
                    $duplicateScale->id,
                    $canonicalScale->id,
                );
                DB::table('rating_scales')->where('id', $duplicateScale->id)->delete();
            }
        }
    }

    private function mergeRatingScaleLevels(int $sourceScaleId, int $targetScaleId): void
    {
        $sourceLevels = DB::table('rating_scale_levels')
            ->where('rating_scale_id', $sourceScaleId)
            ->orderBy('sort_order')
            ->get();

        foreach ($sourceLevels as $sourceLevel) {
            $targetLevel = DB::table('rating_scale_levels')
                ->where('rating_scale_id', $targetScaleId)
                ->where(function ($query) use ($sourceLevel): void {
                    $query->where('value', $sourceLevel->value)
                        ->orWhere('sort_order', $sourceLevel->sort_order);
                })
                ->orderByRaw('CASE WHEN value = ? THEN 0 ELSE 1 END', [$sourceLevel->value])
                ->first();

            if ($targetLevel) {
                $this->remapReferences(
                    self::RATING_LEVEL_REFERENCES,
                    $sourceLevel->id,
                    $targetLevel->id,
                );
                DB::table('rating_scale_levels')->where('id', $sourceLevel->id)->delete();

                continue;
            }

            DB::table('rating_scale_levels')
                ->where('id', $sourceLevel->id)
                ->update(['rating_scale_id' => $targetScaleId]);
        }
    }

    /**
     * @param  array<string, list<string>>  $references
     */
    private function remapReferences(array $references, int $sourceId, int $targetId): void
    {
        foreach ($references as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach ($columns as $column) {
                if (! Schema::hasColumn($table, $column)) {
                    continue;
                }

                DB::table($table)
                    ->where($column, $sourceId)
                    ->update([$column => $targetId]);
            }
        }
    }

    private function makeScaleNamesUnique(): void
    {
        $duplicates = DB::table('rating_scales')
            ->select('name')
            ->groupBy('name')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('name');

        foreach ($duplicates as $name) {
            $scales = DB::table('rating_scales')
                ->where('name', $name)
                ->orderBy('id')
                ->get();

            foreach ($scales->skip(1) as $scale) {
                $candidate = "{$name} ({$scale->code})";

                if (DB::table('rating_scales')->where('name', $candidate)->exists()) {
                    $candidate .= " #{$scale->id}";
                }

                DB::table('rating_scales')
                    ->where('id', $scale->id)
                    ->update(['name' => $candidate]);
            }
        }
    }

    private function makeEmployeeFieldSettingsGlobal(): void
    {
        if (! Schema::hasTable('employee_field_settings')
            || ! Schema::hasColumn('employee_field_settings', 'organization_id')) {
            return;
        }

        $duplicates = DB::table('employee_field_settings')
            ->select('screen_key', 'field_key', DB::raw('MIN(id) AS canonical_id'))
            ->groupBy('screen_key', 'field_key')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $duplicate) {
            DB::table('employee_field_settings')
                ->where('screen_key', $duplicate->screen_key)
                ->where('field_key', $duplicate->field_key)
                ->where('id', '!=', $duplicate->canonical_id)
                ->delete();
        }

        $this->dropIndexIfExists(
            'employee_field_settings',
            'employee_field_settings_organization_id_screen_key_field_key_unique',
        );
        $this->dropIndexIfExists(
            'employee_field_settings',
            'employee_field_settings_organization_id_index',
        );

        Schema::table('employee_field_settings', function (Blueprint $table): void {
            $table->dropColumn('organization_id');
        });

        Schema::table('employee_field_settings', function (Blueprint $table): void {
            $table->unique(['screen_key', 'field_key']);
        });
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        $exists = collect(Schema::getIndexes($table))
            ->contains(fn (array $definition): bool => $definition['name'] === $index);

        if (! $exists) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($index): void {
            $blueprint->dropIndex($index);
        });
    }
};
