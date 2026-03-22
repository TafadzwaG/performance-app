<?php

namespace App\Http\Requests\Performance\Setup;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobTitleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $jobTitle = $this->route('job_title');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('job_titles', 'name')->ignore($jobTitle?->id)],
            'code' => ['required', 'string', 'max:100', Rule::unique('job_titles', 'code')->ignore($jobTitle?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
