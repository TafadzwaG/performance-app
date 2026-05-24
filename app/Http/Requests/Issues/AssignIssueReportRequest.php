<?php

namespace App\Http\Requests\Issues;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignIssueReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assignee_user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
