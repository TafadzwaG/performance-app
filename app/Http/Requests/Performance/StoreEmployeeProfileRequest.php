<?php

namespace App\Http\Requests\Performance;

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
