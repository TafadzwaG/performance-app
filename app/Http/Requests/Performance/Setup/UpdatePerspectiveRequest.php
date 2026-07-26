<?php

namespace App\Http\Requests\Performance\Setup;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePerspectiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $perspective = $this->route('perspective');

        return [
            'name' => ['required', 'string', 'max:255', TenantRule::unique('perspectives', 'name', $perspective?->id)],
            'code' => ['required', 'string', 'max:100', TenantRule::unique('perspectives', 'code', $perspective?->id)],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
