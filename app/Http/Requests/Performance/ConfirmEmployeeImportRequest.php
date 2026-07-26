<?php

namespace App\Http\Requests\Performance;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class ConfirmEmployeeImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_mappings' => ['required', 'array'],
            'department_mappings.*.source' => ['required', 'string'],
            'department_mappings.*.department_id' => ['required', 'integer', TenantRule::exists('departments')],
            'job_title_mappings' => ['required', 'array'],
            'job_title_mappings.*.source' => ['required', 'string'],
            'job_title_mappings.*.job_title_id' => ['required', 'integer', TenantRule::exists('job_titles')],
        ];
    }
}
