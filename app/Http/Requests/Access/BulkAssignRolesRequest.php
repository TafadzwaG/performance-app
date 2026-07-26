<?php

namespace App\Http\Requests\Access;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAssignRolesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('Super Admin') ?? false;
    }

    public function rules(): array
    {
        return [
            'apply_to_filter' => ['required', 'boolean'],
            'user_ids' => ['required_unless:apply_to_filter,true', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', TenantRule::exists('roles')],
            'mode' => ['required', 'string', Rule::in(['replace', 'add', 'remove'])],
            'search' => ['nullable', 'string'],
            'approval_status' => ['nullable', 'string', Rule::in(['active', 'pending'])],
            'sort_by' => ['nullable', 'string', Rule::in(['name', 'email', 'employee_number', 'created_at', 'updated_at'])],
            'sort_dir' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
            'role_id' => ['nullable', 'integer', TenantRule::exists('roles')],
            'department_id' => ['nullable', 'integer', TenantRule::exists('departments')],
            'employee_link' => ['nullable', 'string', Rule::in(['linked', 'unlinked'])],
            'has_direct_permissions' => ['nullable', 'string', Rule::in(['yes', 'no'])],
        ];
    }

    public function messages(): array
    {
        return [
            'user_ids.required_unless' => 'Select at least one user or choose all matching users.',
        ];
    }
}
