<?php

namespace App\Support\Access;

use App\Support\Tenancy\TenantRule;
use App\Tenancy\TenantContext;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserProvisionRules
{
    public static function single(?int $ignoreUserId = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['nullable', 'string', Password::defaults(), 'confirmed'],
            'send_credentials_email' => ['required', 'boolean'],
            'force_password_change' => ['required', 'boolean'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', TenantRule::exists('roles')],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
            'access_all_locations' => ['sometimes', 'boolean'],
            'location_ids' => ['nullable', 'array'],
            'location_ids.*' => ['integer', Rule::exists('locations', 'id')->where('organization_id', app(TenantContext::class)->id())],
        ];
    }

    public static function bulk(string $prefix = 'users'): array
    {
        return [
            $prefix => ['required', 'array', 'min:1'],
            "{$prefix}.*.name" => ['required', 'string', 'max:255'],
            "{$prefix}.*.email" => ['required', 'string', 'email', 'max:255', 'distinct'],
            "{$prefix}.*.password" => ['nullable', 'string', Password::defaults()],
            "{$prefix}.*.send_credentials_email" => ['required', 'boolean'],
            "{$prefix}.*.force_password_change" => ['required', 'boolean'],
            "{$prefix}.*.role_ids" => ['nullable', 'array'],
            "{$prefix}.*.role_ids.*" => ['integer', TenantRule::exists('roles')],
            "{$prefix}.*.permission_ids" => ['nullable', 'array'],
            "{$prefix}.*.permission_ids.*" => ['integer', 'exists:permissions,id'],
        ];
    }
}
