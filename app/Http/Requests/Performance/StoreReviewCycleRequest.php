<?php

namespace App\Http\Requests\Performance;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreReviewCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', TenantRule::unique('review_cycles', 'name')],
            'code' => ['required', 'string', 'max:100', TenantRule::unique('review_cycles', 'code')],
            'description' => ['nullable', 'string'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'goal_setting_deadline' => ['nullable', 'date'],
            'self_assessment_deadline' => ['nullable', 'date'],
            'manager_review_deadline' => ['nullable', 'date'],
            'approval_deadline' => ['nullable', 'date'],
            'template_id' => [
                'required',
                TenantRule::exists('appraisal_templates')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'status' => ['prohibited'],
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
