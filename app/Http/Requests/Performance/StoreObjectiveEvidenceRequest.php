<?php

namespace App\Http\Requests\Performance;

use App\Support\Security\EvidenceUploadRules;
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
            'file' => array_merge(['required_if:evidence_type,file'], array_slice(EvidenceUploadRules::fileRules(), 1)),
            'url' => array_merge(['required_if:evidence_type,link'], array_slice(EvidenceUploadRules::httpUrlRules(), 1)),
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
