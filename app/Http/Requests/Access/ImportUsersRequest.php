<?php

namespace App\Http\Requests\Access;

use Illuminate\Foundation\Http\FormRequest;

class ImportUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,ods'],
            'default_role_ids' => ['nullable', 'array'],
            'default_role_ids.*' => ['integer', 'exists:roles,id'],
            'default_permission_ids' => ['nullable', 'array'],
            'default_permission_ids.*' => ['integer', 'exists:permissions,id'],
            'default_force_password_change' => ['required', 'boolean'],
            'default_send_credentials_email' => ['required', 'boolean'],
        ];
    }
}
