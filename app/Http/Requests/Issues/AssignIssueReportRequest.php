<?php

namespace App\Http\Requests\Issues;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class AssignIssueReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assignee_user_id' => ['required', 'integer', TenantRule::activeMember()],
            'note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
