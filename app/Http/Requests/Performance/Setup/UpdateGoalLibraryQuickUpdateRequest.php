<?php

namespace App\Http\Requests\Performance\Setup;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGoalLibraryQuickUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'perspective_id' => ['sometimes', 'required', TenantRule::exists('perspectives')],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'kpi_measure' => ['nullable', 'string'],
            'default_weight' => ['nullable', 'numeric', 'gt:0', 'max:100'],
        ];
    }
}
