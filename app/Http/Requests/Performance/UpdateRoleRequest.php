<?php

namespace App\Http\Requests\Performance;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $role = $this->route('role');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                TenantRule::unique('roles', 'name', $role)
                    ->where(fn ($query) => $query->where('guard_name', 'web')),
            ],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', TenantRule::activeMember()],
        ];
    }
}
