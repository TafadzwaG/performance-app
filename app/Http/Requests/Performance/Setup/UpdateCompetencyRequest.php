<?php

namespace App\Http\Requests\Performance\Setup;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompetencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $competency = $this->route('competency');

        return [
            'name' => ['required', 'string', 'max:255', TenantRule::unique('competencies', 'name', $competency?->id)],
            'code' => ['required', 'string', 'max:100', TenantRule::unique('competencies', 'code', $competency?->id)],
            'description' => ['nullable', 'string'],
            'category' => ['required', Rule::in(['competency', 'value', 'behaviour'])],
            'department_id' => ['nullable', TenantRule::exists('departments')],
            'job_title_id' => ['nullable', TenantRule::exists('job_titles')],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
