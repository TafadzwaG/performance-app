<?php

namespace App\Http\Requests\Issues;

use App\Enums\IssueType;
use App\Models\IssueReport;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIssueReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $issue = $this->route('issue');

        return $issue instanceof IssueReport
            && $this->user()?->can('update', $issue);
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(IssueType::class)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
        ];
    }
}
