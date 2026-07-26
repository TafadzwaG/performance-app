<?php

namespace App\Http\Requests\Performance;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitSelfAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'objectives' => ['required', 'array', 'min:1'],
            'objectives.*.id' => ['required', TenantRule::exists('appraisal_objectives')],
            'objectives.*.performance_achieved' => ['required', 'string'],
            'objectives.*.self_rating_scale_level_id' => ['required', Rule::exists('rating_scale_levels', 'id')],
            'objectives.*.employee_comment' => ['nullable', 'string'],
            'competency_ratings' => ['nullable', 'array'],
            'competency_ratings.*.id' => ['required_with:competency_ratings', TenantRule::exists('appraisal_competency_ratings')],
            'competency_ratings.*.self_rating_scale_level_id' => ['nullable', Rule::exists('rating_scale_levels', 'id')],
            'competency_ratings.*.employee_comment' => ['nullable', 'string'],
            'achievement_note' => ['nullable', 'string'],
            'significant_issue' => ['nullable', 'string'],
        ];
    }
}
