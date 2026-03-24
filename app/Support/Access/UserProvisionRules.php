<?php

namespace App\Support\Access;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserProvisionRules
{
    public static function single(?int $ignoreUserId = null): array
    {
        $emailRule = Rule::unique('users', 'email');

        if ($ignoreUserId) {
            $emailRule = $emailRule->ignore($ignoreUserId);
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', $emailRule],
            'password' => ['nullable', 'string', Password::defaults(), 'confirmed'],
            'send_credentials_email' => ['required', 'boolean'],
            'force_password_change' => ['required', 'boolean'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ];
    }

    public static function bulk(string $prefix = 'users'): array
    {
        return [
            $prefix => ['required', 'array', 'min:1'],
            "{$prefix}.*.name" => ['required', 'string', 'max:255'],
            "{$prefix}.*.email" => ['required', 'string', 'email', 'max:255', 'distinct', Rule::unique('users', 'email')],
            "{$prefix}.*.password" => ['nullable', 'string', Password::defaults()],
            "{$prefix}.*.send_credentials_email" => ['required', 'boolean'],
            "{$prefix}.*.force_password_change" => ['required', 'boolean'],
            "{$prefix}.*.role_ids" => ['nullable', 'array'],
            "{$prefix}.*.role_ids.*" => ['integer', 'exists:roles,id'],
            "{$prefix}.*.permission_ids" => ['nullable', 'array'],
            "{$prefix}.*.permission_ids.*" => ['integer', 'exists:permissions,id'],
        ];
    }
}
