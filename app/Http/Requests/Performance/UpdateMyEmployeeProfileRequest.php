<?php

namespace App\Http\Requests\Performance;

use App\Support\Performance\EmployeeFieldRegistry;
use App\Support\Performance\EmployeeProfileFieldRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMyEmployeeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        $profile = $this->user()?->employeeProfile;

        return $profile !== null && $this->user()?->can('update', $profile);
    }

    public function rules(): array
    {
        return EmployeeProfileFieldRules::make(
            EmployeeFieldRegistry::SCREEN_EMPLOYEE_SELF_EDIT,
            $this->user()?->employeeProfile,
            $this->user(),
        );
    }
}
