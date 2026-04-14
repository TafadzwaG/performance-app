<?php

namespace App\Http\Requests\Performance;

use App\Models\Appraisal;
use App\Models\DevelopmentPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreDevelopmentPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Appraisal|null $appraisal */
        $appraisal = $this->route('appraisal');
        $canManagePlan = $appraisal
            ? Gate::forUser($this->user())->allows('manage', [DevelopmentPlan::class, $appraisal])
            : false;

        $canUpdateProgress = $appraisal
            ? Gate::forUser($this->user())->allows('progress', [DevelopmentPlan::class, $appraisal])
            : false;

        if ($canManagePlan) {
            return [
                'strengths' => ['nullable', 'string'],
                'improvement_areas' => ['nullable', 'string'],
                'follow_up_notes' => ['nullable', 'string'],
                'actions' => ['nullable', 'array'],
                'actions.*.action' => ['required_with:actions', 'string', 'max:255'],
                'actions.*.owner_user_id' => ['nullable', 'exists:users,id'],
                'actions.*.due_date' => ['nullable', 'date'],
                'actions.*.status' => ['nullable', Rule::in(['pending', 'in_progress', 'completed'])],
                'actions.*.follow_up_status' => ['nullable', 'string', 'max:255'],
            ];
        }

        if ($canUpdateProgress) {
            return [
                'strengths' => ['prohibited'],
                'improvement_areas' => ['prohibited'],
                'follow_up_notes' => ['nullable', 'string'],
                'actions' => ['nullable', 'array'],
                'actions.*.id' => ['required_with:actions', 'integer', 'exists:development_plan_actions,id'],
                'actions.*.action' => ['prohibited'],
                'actions.*.owner_user_id' => ['prohibited'],
                'actions.*.due_date' => ['prohibited'],
                'actions.*.status' => ['nullable', Rule::in(['pending', 'in_progress', 'completed'])],
                'actions.*.follow_up_status' => ['nullable', 'string', 'max:255'],
            ];
        }

        return [
            'actions' => ['prohibited'],
        ];
    }
}
