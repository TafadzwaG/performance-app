<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;

class DeleteEmployeeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        $employeeProfile = $this->route('employee_profile');

        return $employeeProfile && $this->user()?->can('delete', $employeeProfile);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'current_password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.current_password' => 'Your password is incorrect.',
        ];
    }
}
