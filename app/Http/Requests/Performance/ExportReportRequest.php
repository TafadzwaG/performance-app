<?php

namespace App\Http\Requests\Performance;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class ExportReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'format' => ['nullable', 'in:xlsx,pdf'],
            'review_cycle_id' => ['nullable', TenantRule::exists('review_cycles')],
            'department_id' => ['nullable', TenantRule::exists('departments')],
            'location_id' => ['nullable', TenantRule::visibleLocation()],
            'employee_profile_id' => ['nullable', TenantRule::exists('employee_profiles')],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('format')) {
            $this->merge(['format' => 'xlsx']);
        }
    }
}
