<?php

namespace App\Http\Requests\Performance\Setup;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGoalLibraryWeightRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'default_weight' => ['required', 'numeric', 'gt:0', 'max:100'],
        ];
    }
}
