<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitCalibrationDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::in(['confirmed', 'adjusted', 'send_back'])],
            'comment' => ['required', 'string'],
            'calibrated_overall_score' => ['nullable', 'numeric', 'between:0,100', 'required_if:decision,adjusted'],
            'calibrated_overall_rating_scale_level_id' => ['nullable', 'exists:rating_scale_levels,id', 'required_if:decision,adjusted'],
            'evidence_summary' => ['nullable', 'string', 'required_if:decision,adjusted'],
        ];
    }
}
