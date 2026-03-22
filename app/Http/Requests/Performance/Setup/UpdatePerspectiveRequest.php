<?php

namespace App\Http\Requests\Performance\Setup;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'name' => ['required', 'string', 'max:255', Rule::unique('perspectives', 'name')->ignore($perspective?->id)],
            'code' => ['required', 'string', 'max:100', Rule::unique('perspectives', 'code')->ignore($perspective?->id)],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
