<?php

namespace App\Http\Requests\Access;

use App\Models\User;
use App\Support\Access\UserExportColumnRegistry;
use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExportUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', User::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string'],
            'approval_status' => ['nullable', 'string', Rule::in(['active', 'pending'])],
            'sort_by' => ['nullable', 'string', Rule::in(['name', 'email', 'employee_number', 'created_at', 'updated_at'])],
            'sort_dir' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
            'role_id' => ['nullable', 'integer', TenantRule::exists('roles')],
            'department_id' => ['nullable', 'integer', TenantRule::exists('departments')],
            'employee_link' => ['nullable', 'string', Rule::in(['linked', 'unlinked'])],
            'has_direct_permissions' => ['nullable', 'string', Rule::in(['yes', 'no'])],
            'columns' => ['nullable', 'array', 'min:1'],
            'columns.*' => ['string', Rule::in(UserExportColumnRegistry::allowedKeys())],
            'format' => ['nullable', 'string', Rule::in(['xlsx', 'pdf'])],
        ];
    }
}
