<?php

namespace App\Http\Requests\Performance;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGoalPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'objectives' => ['required', 'array', 'min:1'],
            'objectives.*.id' => ['nullable', 'distinct', TenantRule::exists('appraisal_objectives')],
            'objectives.*.perspective_id' => ['required', TenantRule::exists('perspectives')],
            'objectives.*.goal_library_item_id' => ['nullable', TenantRule::exists('goal_library_items')],
            'objectives.*.objective_type' => ['nullable', 'string', 'max:50'],
            'objectives.*.title' => ['required', 'string', 'max:255'],
            'objectives.*.kpi_measure' => ['nullable', 'string'],
            'objectives.*.target_definition' => ['nullable', 'string'],
            'objectives.*.weight' => ['required', 'numeric', 'between:0,100'],
            'objectives.*.evidence_source' => ['nullable', 'string'],
            'objectives.*.due_date' => ['nullable', 'date'],
            'objectives.*.include_in_business_score' => ['nullable', 'boolean'],
        ];
    }
}
