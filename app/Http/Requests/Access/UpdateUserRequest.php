<?php

namespace App\Http\Requests\Access;

use App\Support\Tenancy\TenantRule;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', TenantRule::exists('roles')],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
            'access_all_locations' => ['required', 'boolean'],
            'location_ids' => ['nullable', 'array'],
            'location_ids.*' => ['integer', Rule::exists('locations', 'id')->where('organization_id', app(TenantContext::class)->id())],
        ];
    }
}
