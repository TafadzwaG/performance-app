<?php

namespace App\Http\Requests\Performance\Setup;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $department = $this->route('department');

        return [
            'name' => ['required', 'string', 'max:255', TenantRule::unique('departments', 'name', $department?->id)],
            'code' => ['required', 'string', 'max:100', TenantRule::unique('departments', 'code', $department?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
