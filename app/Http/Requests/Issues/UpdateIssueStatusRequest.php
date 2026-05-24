<?php

namespace App\Http\Requests\Issues;

use App\Enums\IssueStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIssueStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(IssueStatus::class)],
            'note' => [
                Rule::requiredIf(fn () => $this->input('status') === IssueStatus::Completed->value),
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}
