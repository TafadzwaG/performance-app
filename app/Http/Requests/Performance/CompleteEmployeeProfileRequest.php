<?php

namespace App\Http\Requests\Performance;

use App\Support\Performance\EmployeeFieldRegistry;
use App\Support\Performance\EmployeeProfileFieldRules;
use Illuminate\Foundation\Http\FormRequest;

class CompleteEmployeeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return EmployeeProfileFieldRules::make(
            EmployeeFieldRegistry::SCREEN_COMPLETE_PROFILE,
            null,
            $this->user(),
        );
    }
}
