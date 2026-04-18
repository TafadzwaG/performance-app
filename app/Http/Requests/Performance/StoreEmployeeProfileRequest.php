<?php

namespace App\Http\Requests\Performance;

use App\Support\Performance\EmployeeFieldRegistry;
use App\Support\Performance\EmployeeProfileFieldRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return EmployeeProfileFieldRules::make(EmployeeFieldRegistry::SCREEN_EMPLOYEE_CREATE);
    }
}
