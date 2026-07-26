<?php

namespace App\Http\Requests\Performance\Setup;

use App\Services\Performance\GoalLibraryScopeService;
use App\Support\Tenancy\TenantRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreGoalLibraryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $scope = app(GoalLibraryScopeService::class);

        if ($scope->appliesTo($this->user())) {
            $this->merge($scope->enforcedWriteAttributes($this->user()));
        }
    }

    public function rules(): array
    {
        $scoped = app(GoalLibraryScopeService::class)->appliesTo($this->user());

        return [
            'department_id' => [$scoped ? 'required' : 'nullable', TenantRule::exists('departments')],
            'job_title_id' => [$scoped ? 'required' : 'nullable', TenantRule::exists('job_titles')],
            'perspective_id' => ['required', TenantRule::exists('perspectives')],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'kpi_measure' => ['nullable', 'string'],
            'target_definition' => ['nullable', 'string'],
            'default_weight' => ['nullable', 'numeric', 'between:0,100'],
            'evidence_source' => ['nullable', 'string'],
            'timeline_days' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
