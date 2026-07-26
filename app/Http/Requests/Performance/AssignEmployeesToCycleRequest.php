<?php

namespace App\Http\Requests\Performance;

use App\Support\Tenancy\TenantRule;
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
            'template_id' => ['required', TenantRule::exists('appraisal_templates')],
            'employee_profile_ids' => ['required', 'array', 'min:1'],
            'employee_profile_ids.*' => ['integer', TenantRule::exists('employee_profiles')],
        ];
    }
}
