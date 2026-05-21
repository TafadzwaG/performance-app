<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmGoalLibraryImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'perspective_mappings' => ['required', 'array'],
            'perspective_mappings.*.source' => ['required', 'string'],
            'perspective_mappings.*.perspective_id' => ['required', 'integer', 'exists:perspectives,id'],
            'department_mappings' => ['nullable', 'array'],
            'department_mappings.*.source' => ['required', 'string'],
            'department_mappings.*.department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'job_title_mappings' => ['nullable', 'array'],
            'job_title_mappings.*.source' => ['required', 'string'],
            'job_title_mappings.*.job_title_id' => ['nullable', 'integer', 'exists:job_titles,id'],
        ];
    }
}
