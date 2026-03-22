<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreObjectiveEvidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'evidence_type' => ['required', Rule::in(['file', 'link'])],
            'file' => ['nullable', 'file', 'max:10240'],
            'url' => ['nullable', 'url'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
