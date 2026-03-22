<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;

class SubmitManagerReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'objectives' => ['required', 'array', 'min:1'],
            'objectives.*.id' => ['required', 'exists:appraisal_objectives,id'],
            'objectives.*.manager_rating_scale_level_id' => ['required', 'exists:rating_scale_levels,id'],
            'objectives.*.manager_comment' => ['nullable', 'string'],
            'competency_ratings' => ['nullable', 'array'],
            'competency_ratings.*.id' => ['required_with:competency_ratings', 'exists:appraisal_competency_ratings,id'],
            'competency_ratings.*.manager_rating_scale_level_id' => ['nullable', 'exists:rating_scale_levels,id'],
            'competency_ratings.*.manager_comment' => ['nullable', 'string'],
            'comment' => ['nullable', 'string'],
        ];
    }
}
