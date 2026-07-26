<?php

namespace App\Support\Performance;

use App\Enums\EmploymentStatus;
use App\Models\EmployeeProfile;
use App\Services\Performance\EmployeeFieldConfigService;
use App\Support\Tenancy\TenantRule;
use App\Tenancy\TenantContext;
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
        $organizationId = app(TenantContext::class)->id();
        $tenantUnique = fn (string $column) => Rule::unique('employee_profiles', $column)
            ->where(fn ($query) => $query->where('organization_id', $organizationId))
            ->ignore($profile?->id);

        return match ($fieldKey) {
            'user_id' => [TenantRule::activeMember(), $tenantUnique('user_id')],
            'employee_number' => ['string', 'max:100', $tenantUnique('employee_number')],
            'national_id' => ['string', 'max:100', $tenantUnique('national_id')],
            'date_of_birth', 'hire_date', 'probation_end_date', 'confirmation_date', 'review_eligibility_date' => ['date'],
            'gender' => [Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'marital_status' => [Rule::in(['single', 'married', 'divorced', 'widowed', 'separated'])],
            'personal_phone', 'emergency_contact_phone' => ['string', 'max:50', 'regex:/^\+\d{7,15}$/'],
            'home_address_line_1', 'home_address_line_2' => ['string', 'max:255'],
            'city', 'state_province', 'country' => ['string', 'max:100'],
            'postal_code' => ['string', 'max:30'],
            'emergency_contact_name', 'work_location' => ['string', 'max:255'],
            'department_id' => [TenantRule::exists('departments')],
            'location_id' => [TenantRule::visibleLocation()],
            'job_title_id' => [TenantRule::exists('job_titles')],
            'line_manager_user_id' => [TenantRule::activeMember(), $user ? Rule::notIn([$user->getAuthIdentifier()]) : 'different:user_id'],
            'approving_manager_user_id' => [TenantRule::activeMember(), $user ? Rule::notIn([$user->getAuthIdentifier()]) : 'different:user_id'],
            'employment_status' => [Rule::in(array_map(fn (EmploymentStatus $status) => $status->value, EmploymentStatus::cases()))],
            'employment_type' => [Rule::in(['permanent', 'contract', 'temporary', 'intern', 'consultant'])],
            'is_review_eligible', 'is_active' => ['boolean'],
            'notes' => ['string', 'max:5000'],
            'role_ids' => ['array'],
            default => null,
        };
    }
}
