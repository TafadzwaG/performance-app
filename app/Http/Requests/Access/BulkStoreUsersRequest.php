<?php

namespace App\Http\Requests\Access;

use App\Support\Access\UserProvisionRules;
use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkStoreUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return array_merge(UserProvisionRules::bulk(), [
            'default_role_ids' => ['nullable', 'array'],
            'default_role_ids.*' => ['integer', TenantRule::exists('roles')],
            'default_permission_ids' => ['nullable', 'array'],
            'default_permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);
    }
}
