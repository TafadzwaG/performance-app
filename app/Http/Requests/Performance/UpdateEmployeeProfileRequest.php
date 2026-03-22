<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $profile = $this->route('employee');

        return [
            'user_id' => ['required', 'exists:users,id', Rule::unique('employee_profiles', 'user_id')->ignore($profile?->id)],
            'employee_number' => ['required', 'string', 'max:100', Rule::unique('employee_profiles', 'employee_number')->ignore($profile?->id)],
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_title_id' => ['nullable', 'exists:job_titles,id'],
            'line_manager_user_id' => ['nullable', 'exists:users,id', 'different:user_id'],
            'approving_manager_user_id' => ['nullable', 'exists:users,id', 'different:user_id'],
            'employment_status' => ['required', Rule::in(['active', 'probation', 'contract', 'exited'])],
            'hire_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ];
    }
}
