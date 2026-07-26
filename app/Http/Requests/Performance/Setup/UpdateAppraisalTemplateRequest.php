<?php

namespace App\Http\Requests\Performance\Setup;

use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppraisalTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $template = $this->route('template');

        return [
            'name' => ['required', 'string', 'max:255', TenantRule::unique('appraisal_templates', 'name', $template?->id)->where(fn ($query) => $query->where('version', $this->integer('version', 1)))],
            'code' => ['required', 'string', 'max:100', TenantRule::unique('appraisal_templates', 'code', $template?->id)->where(fn ($query) => $query->where('version', $this->integer('version', 1)))],
            'version' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'department_id' => ['nullable', TenantRule::exists('departments')],
            'job_title_id' => ['nullable', TenantRule::exists('job_titles')],
            'objective_rating_scale_id' => ['required', Rule::exists('rating_scales', 'id')],
            'competency_rating_scale_id' => ['required', Rule::exists('rating_scales', 'id')],
            'overall_rating_scale_id' => ['required', Rule::exists('rating_scales', 'id')],
            'business_weight_percent' => ['required', 'integer', 'between:0,100'],
            'values_weight_percent' => ['required', 'integer', 'between:0,100'],
            'min_objectives' => ['required', 'integer', 'between:1,10'],
            'max_objectives' => ['required', 'integer', 'gte:min_objectives', 'between:1,10'],
            'allow_competencies' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_type' => ['required', Rule::in(['objective', 'competency'])],
            'items.*.perspective_id' => ['nullable', TenantRule::exists('perspectives')],
            'items.*.competency_id' => ['nullable', TenantRule::exists('competencies')],
            'items.*.title' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.default_weight' => ['nullable', 'numeric', 'between:0,100'],
            'items.*.evidence_source_hint' => ['nullable', 'string'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
            'items.*.is_required' => ['nullable', 'boolean'],
            'template_id' => ['nullable', Rule::in([$template?->id])],
        ];
    }
}
