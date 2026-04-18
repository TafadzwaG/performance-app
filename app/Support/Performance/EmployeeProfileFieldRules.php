<?php

namespace App\Support\Performance;

use App\Enums\EmploymentStatus;
use App\Models\EmployeeProfile;
use App\Services\Performance\EmployeeFieldConfigService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Validation\Rule;

class EmployeeProfileFieldRules
{
    public static function make(string $screenKey, ?EmployeeProfile $profile = null, ?Authenticatable $user = null): array
    {
        $enabledFields = collect(app(EmployeeFieldConfigService::class)->forScreen($screenKey))
            ->filter(fn (array $field) => $field['enabled'])
            ->keyBy('field_key');

        $rules = [];

        foreach ($enabledFields as $fieldKey => $field) {
            $baseRules = self::baseRules($fieldKey, $profile, $user);

            if ($baseRules === null) {
                continue;
            }

            array_unshift($baseRules, $field['required'] ? 'required' : 'nullable');
            $rules[$fieldKey] = $baseRules;
        }

        return $rules;
    }

    private static function baseRules(string $fieldKey, ?EmployeeProfile $profile, ?Authenticatable $user): ?array
    {
        return match ($fieldKey) {
            'user_id' => ['exists:users,id', Rule::unique('employee_profiles', 'user_id')->ignore($profile?->id)],
            'employee_number' => ['string', 'max:100', Rule::unique('employee_profiles', 'employee_number')->ignore($profile?->id)],
            'national_id' => ['string', 'max:100', Rule::unique('employee_profiles', 'national_id')->ignore($profile?->id)],
            'date_of_birth', 'hire_date', 'probation_end_date', 'confirmation_date', 'review_eligibility_date' => ['date'],
            'gender' => [Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'marital_status' => [Rule::in(['single', 'married', 'divorced', 'widowed', 'separated'])],
            'personal_phone', 'emergency_contact_phone' => ['string', 'max:50', 'regex:/^\+\d{7,15}$/'],
            'home_address_line_1', 'home_address_line_2' => ['string', 'max:255'],
            'city', 'state_province', 'country' => ['string', 'max:100'],
            'postal_code' => ['string', 'max:30'],
            'emergency_contact_name', 'work_location' => ['string', 'max:255'],
            'department_id' => ['exists:departments,id'],
            'job_title_id' => ['exists:job_titles,id'],
            'line_manager_user_id' => ['exists:users,id', $user ? Rule::notIn([$user->getAuthIdentifier()]) : 'different:user_id'],
            'approving_manager_user_id' => ['exists:users,id', $user ? Rule::notIn([$user->getAuthIdentifier()]) : 'different:user_id'],
            'employment_status' => [Rule::in(array_map(fn (EmploymentStatus $status) => $status->value, EmploymentStatus::cases()))],
            'employment_type' => [Rule::in(['permanent', 'contract', 'temporary', 'intern', 'consultant'])],
            'is_review_eligible', 'is_active' => ['boolean'],
            'notes' => ['string', 'max:5000'],
            'role_ids' => ['array'],
            default => null,
        };
    }
}
