<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDevelopmentPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'strengths' => ['nullable', 'string'],
            'improvement_areas' => ['nullable', 'string'],
            'follow_up_notes' => ['nullable', 'string'],
            'actions' => ['nullable', 'array'],
            'actions.*.action' => ['required_with:actions', 'string', 'max:255'],
            'actions.*.owner_user_id' => ['nullable', 'exists:users,id'],
            'actions.*.due_date' => ['nullable', 'date'],
            'actions.*.status' => ['nullable', Rule::in(['pending', 'in_progress', 'completed'])],
            'actions.*.follow_up_status' => ['nullable', 'string', 'max:255'],
        ];
    }
}
