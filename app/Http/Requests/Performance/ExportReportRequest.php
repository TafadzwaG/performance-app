<?php

namespace App\Http\Requests\Performance;

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
            'review_cycle_id' => ['nullable', 'exists:review_cycles,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'employee_profile_id' => ['nullable', 'exists:employee_profiles,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('format')) {
            $this->merge(['format' => 'xlsx']);
        }
    }
}
