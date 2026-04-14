<?php

namespace App\Http\Requests\Performance;

use App\Enums\EmploymentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id', 'unique:employee_profiles,user_id'],
            'employee_number' => ['required', 'string', 'max:100', 'unique:employee_profiles,employee_number'],
            'national_id' => ['nullable', 'string', 'max:100', 'unique:employee_profiles,national_id'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in($this->genderValues())],
            'marital_status' => ['nullable', Rule::in($this->maritalStatusValues())],
            'personal_phone' => ['nullable', 'string', 'max:50', 'regex:/^\+\d{7,15}$/'],
            'home_address_line_1' => ['nullable', 'string', 'max:255'],
            'home_address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state_province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:30'],
            'country' => ['nullable', 'string', 'max:100'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50', 'regex:/^\+\d{7,15}$/'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_title_id' => ['nullable', 'exists:job_titles,id'],
            'line_manager_user_id' => ['nullable', 'exists:users,id', 'different:user_id'],
            'approving_manager_user_id' => ['nullable', 'exists:users,id', 'different:user_id'],
            'employment_status' => ['required', Rule::in(array_map(fn (EmploymentStatus $status) => $status->value, EmploymentStatus::cases()))],
            'employment_type' => ['nullable', Rule::in($this->employmentTypeValues())],
            'work_location' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'probation_end_date' => ['nullable', 'date'],
            'confirmation_date' => ['nullable', 'date'],
            'is_review_eligible' => ['nullable', 'boolean'],
            'review_eligibility_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['nullable', 'boolean'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ];
    }

    private function genderValues(): array
    {
        return ['male', 'female', 'other', 'prefer_not_to_say'];
    }

    private function maritalStatusValues(): array
    {
        return ['single', 'married', 'divorced', 'widowed', 'separated'];
    }

    private function employmentTypeValues(): array
    {
        return ['permanent', 'contract', 'temporary', 'intern', 'consultant'];
    }
}
