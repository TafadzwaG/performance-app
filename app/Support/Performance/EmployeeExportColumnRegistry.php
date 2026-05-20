<?php

namespace App\Support\Performance;

use App\Models\EmployeeProfile;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class EmployeeExportColumnRegistry
{
    public static function columns(): Collection
    {
        return collect([
            ['key' => 'user_name', 'label' => 'Employee Name', 'section' => 'identity', 'default' => true, 'required' => true],
            ['key' => 'user_email', 'label' => 'User Email', 'section' => 'identity', 'default' => true, 'required' => false],
            ['key' => 'employee_number', 'label' => 'Employee Number', 'section' => 'identity', 'default' => true, 'required' => false],
            ['key' => 'national_id', 'label' => 'National ID', 'section' => 'identity', 'default' => false, 'required' => false],
            ['key' => 'department_id', 'label' => 'Department', 'section' => 'employment', 'default' => true, 'required' => false],
            ['key' => 'job_title_id', 'label' => 'Job Title', 'section' => 'employment', 'default' => true, 'required' => false],
            ['key' => 'employment_status', 'label' => 'Employment Status', 'section' => 'employment', 'default' => true, 'required' => false],
            ['key' => 'employment_type', 'label' => 'Employment Type', 'section' => 'employment', 'default' => false, 'required' => false],
            ['key' => 'work_location', 'label' => 'Work Location', 'section' => 'employment', 'default' => false, 'required' => false],
            ['key' => 'hire_date', 'label' => 'Hire Date', 'section' => 'employment', 'default' => false, 'required' => false],
            ['key' => 'line_manager_user_id', 'label' => 'Line Manager', 'section' => 'performance', 'default' => true, 'required' => false],
            ['key' => 'approving_manager_user_id', 'label' => 'Approving Manager', 'section' => 'performance', 'default' => false, 'required' => false],
            ['key' => 'is_review_eligible', 'label' => 'Review Eligible', 'section' => 'performance', 'default' => true, 'required' => false],
            ['key' => 'is_active', 'label' => 'Active Employee', 'section' => 'performance', 'default' => true, 'required' => false],
            ['key' => 'latest_cycle', 'label' => 'Recent Review Cycle', 'section' => 'performance', 'default' => true, 'required' => false],
            ['key' => 'latest_status', 'label' => 'Recent Review Status', 'section' => 'performance', 'default' => true, 'required' => false],
            ['key' => 'latest_business_score', 'label' => 'Recent Business Score', 'section' => 'performance', 'default' => false, 'required' => false],
            ['key' => 'latest_values_score', 'label' => 'Recent Values Score', 'section' => 'performance', 'default' => false, 'required' => false],
            ['key' => 'latest_overall_score', 'label' => 'Recent Score', 'section' => 'performance', 'default' => true, 'required' => false],
            ['key' => 'latest_overall_rating', 'label' => 'Recent Rating', 'section' => 'performance', 'default' => true, 'required' => false],
        ]);
    }

    public static function defaultKeys(): array
    {
        return self::columns()
            ->filter(fn (array $column) => $column['default'])
            ->pluck('key')
            ->all();
    }

    public static function allowedKeys(): array
    {
        return self::columns()->pluck('key')->all();
    }

    public static function labelsFor(array $keys): array
    {
        $columns = self::columns()->keyBy('key');

        return collect($keys)
            ->map(fn (string $key) => $columns[$key]['label'] ?? $key)
            ->all();
    }

    public static function value(EmployeeProfile $profile, string $key): mixed
    {
        $appraisal = $profile->latestAppraisal;

        return match ($key) {
            'user_name' => $profile->user?->name,
            'user_email' => $profile->user?->email,
            'employee_number' => $profile->employee_number,
            'national_id' => $profile->national_id,
            'department_id' => $profile->department?->name,
            'job_title_id' => $profile->jobTitle?->name,
            'employment_status' => self::label($profile->employment_status?->value ?? $profile->employment_status),
            'employment_type' => self::label($profile->employment_type),
            'work_location' => $profile->work_location,
            'hire_date' => $profile->hire_date?->format('Y-m-d'),
            'line_manager_user_id' => $profile->lineManager?->name,
            'approving_manager_user_id' => $profile->approvingManager?->name,
            'is_review_eligible' => $profile->is_review_eligible ? 'Yes' : 'No',
            'is_active' => $profile->is_active ? 'Yes' : 'No',
            'latest_cycle' => $appraisal?->cycle_name_snapshot ?? $appraisal?->reviewCycle?->name,
            'latest_status' => self::label($appraisal?->status?->value ?? $appraisal?->status),
            'latest_business_score' => $appraisal?->business_score,
            'latest_values_score' => $appraisal?->values_score,
            'latest_overall_score' => $appraisal?->calibrated_overall_score ?? $appraisal?->overall_score,
            'latest_overall_rating' => $appraisal?->calibratedOverallRatingLevel?->label ?? $appraisal?->overallRatingLevel?->label,
            default => null,
        };
    }

    private static function label(?string $value): ?string
    {
        return $value ? Str::of($value)->replace(['_', '-'], ' ')->title()->toString() : null;
    }
}
