<?php

namespace App\Http\Requests\Performance\Setup;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRatingScaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:rating_scales,name'],
            'code' => ['required', 'string', 'max:100', 'unique:rating_scales,code'],
            'applies_to' => ['required', Rule::in(['objective', 'competency', 'overall'])],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'levels' => ['required', 'array', 'min:1'],
            'levels.*.label' => ['required', 'string', 'max:255'],
            'levels.*.description' => ['nullable', 'string'],
            'levels.*.short_label' => ['nullable', 'string', 'max:100'],
            'levels.*.value' => ['required', 'numeric', 'min:0'],
            'levels.*.min_percent' => ['nullable', 'numeric', 'between:0,100'],
            'levels.*.max_percent' => ['nullable', 'numeric', 'between:0,100'],
            'levels.*.color' => ['nullable', 'string', 'max:50'],
            'levels.*.sort_order' => ['required', 'integer', 'min:0'],
            'levels.*.is_default' => ['nullable', 'boolean'],
        ];
    }
}
