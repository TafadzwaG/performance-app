<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validateDeadlineWindow($validator);
            $this->validateDeadlineOrder($validator);
        });
    }

    private function validateDeadlineWindow(Validator $validator): void
    {
        $startDate = $this->date('start_date');
        $endDate = $this->date('end_date');

        if (! $startDate || ! $endDate) {
            return;
        }

        foreach ($this->deadlineFields() as $field => $label) {
            $deadline = $this->date($field);

            if (! $deadline) {
                continue;
            }

            if ($deadline->lt($startDate) || $deadline->gt($endDate)) {
                $validator->errors()->add($field, "{$label} must fall within the review cycle dates.");
            }
        }
    }

    private function validateDeadlineOrder(Validator $validator): void
    {
        $orderedFields = array_keys($this->deadlineFields());
        $previousField = null;
        $previousDate = null;

        foreach ($orderedFields as $field) {
            $date = $this->date($field);

            if (! $date) {
                continue;
            }

            if ($previousDate && $date->lt($previousDate)) {
                $validator->errors()->add(
                    $field,
                    $this->deadlineFields()[$field].' must be on or after '.$this->deadlineFields()[$previousField].'.'
                );
            }

            $previousField = $field;
            $previousDate = $date;
        }
    }

    private function deadlineFields(): array
    {
        return [
            'goal_setting_deadline' => 'Goal setting deadline',
            'self_assessment_deadline' => 'Self-assessment deadline',
            'manager_review_deadline' => 'Manager review deadline',
            'approval_deadline' => 'Approval deadline',
        ];
    }
}
