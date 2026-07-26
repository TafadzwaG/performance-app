<?php

namespace App\Http\Requests\Performance;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeLineManagerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $profile = $this->route('employee_profile');

        return [
            'line_manager_user_id' => [
                'nullable',
                'integer',
                TenantRule::activeMember(),
                Rule::notIn([$profile?->user_id]),
            ],
        ];
    }
}
