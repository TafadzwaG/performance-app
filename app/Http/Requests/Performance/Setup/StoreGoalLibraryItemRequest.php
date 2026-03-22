<?php

namespace App\Http\Requests\Performance\Setup;

use Illuminate\Foundation\Http\FormRequest;

class StoreGoalLibraryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_title_id' => ['nullable', 'exists:job_titles,id'],
            'perspective_id' => ['required', 'exists:perspectives,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'kpi_measure' => ['nullable', 'string'],
            'target_definition' => ['nullable', 'string'],
            'default_weight' => ['nullable', 'numeric', 'between:0,100'],
            'evidence_source' => ['nullable', 'string'],
            'timeline_days' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
