<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;

class AssignEmployeesToCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_id' => ['required', 'exists:appraisal_templates,id'],
            'employee_profile_ids' => ['required', 'array', 'min:1'],
            'employee_profile_ids.*' => ['integer', 'exists:employee_profiles,id'],
        ];
    }
}
