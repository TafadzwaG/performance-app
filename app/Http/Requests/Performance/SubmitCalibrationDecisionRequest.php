<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'evidence_summary' => ['nullable', 'string'],
            'evidence_files' => ['nullable', 'array'],
            'evidence_files.*' => ['file', 'max:10240'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('decision') !== 'adjusted') {
                return;
            }

            if (filled($this->input('evidence_summary'))) {
                return;
            }

            $files = $this->file('evidence_files', []);

            if (is_array($files) && count($files) > 0) {
                return;
            }

            $validator->errors()->add(
                'evidence_summary',
                'Provide an evidence summary or upload at least one supporting file.',
            );
        });
    }
}
