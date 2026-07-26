<?php

namespace App\Http\Requests\Performance\Setup;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

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
            'name' => ['required', 'string', 'max:255', TenantRule::unique('job_titles', 'name', $jobTitle?->id)],
            'code' => ['required', 'string', 'max:100', TenantRule::unique('job_titles', 'code', $jobTitle?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
