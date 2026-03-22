<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitApprovalDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::in(['approve', 'reject', 'send_back'])],
            'comment' => ['nullable', 'string'],
            'reopened_stage' => ['nullable', Rule::in(['goal_setting', 'self_assessment', 'manager_review', 'approval'])],
        ];
    }
}
