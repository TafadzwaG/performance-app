<?php

namespace App\Http\Requests\Performance;

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
                'exists:users,id',
                Rule::notIn([$profile?->user_id]),
            ],
        ];
    }
}

