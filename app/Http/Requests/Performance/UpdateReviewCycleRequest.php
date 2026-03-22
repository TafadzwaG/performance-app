<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReviewCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $cycle = $this->route('review_cycle');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', Rule::unique('review_cycles', 'code')->ignore($cycle?->id)],
            'description' => ['nullable', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'goal_setting_deadline' => ['nullable', 'date'],
            'self_assessment_deadline' => ['nullable', 'date'],
            'manager_review_deadline' => ['nullable', 'date'],
            'approval_deadline' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['draft', 'open', 'closed'])],
        ];
    }
}
