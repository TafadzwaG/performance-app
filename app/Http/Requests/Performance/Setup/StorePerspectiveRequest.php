<?php

namespace App\Http\Requests\Performance\Setup;

use Illuminate\Foundation\Http\FormRequest;

class StorePerspectiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:perspectives,name'],
            'code' => ['required', 'string', 'max:100', 'unique:perspectives,code'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
