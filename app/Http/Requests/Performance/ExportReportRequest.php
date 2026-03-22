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
            'review_cycle_id' => ['nullable', 'exists:review_cycles,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'employee_profile_id' => ['nullable', 'exists:employee_profiles,id'],
        ];
    }
}
