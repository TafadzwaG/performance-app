<?php

namespace App\Http\Requests\Performance\Setup;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompetencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', 'unique:competencies,code'],
            'description' => ['nullable', 'string'],
            'category' => ['required', Rule::in(['competency', 'value', 'behaviour'])],
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_title_id' => ['nullable', 'exists:job_titles,id'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
