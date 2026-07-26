<?php

namespace App\Services\Performance;

use App\Enums\WorkflowStage;
use App\Models\OrganizationSetting;
use App\Tenancy\TenantContext;

class AppraisalWorkflowConfig
{
    public function __construct(
        private readonly TenantContext $tenantContext,
    ) {}

    public function calibrationEnabled(): bool
    {
        $settings = $this->settings();

        if ($settings === null) {
            return true;
        }

        return (bool) ($settings->calibration_enabled ?? true);
    }

    public function isStageEnabled(WorkflowStage $stage): bool
    {
        if ($stage === WorkflowStage::Calibration) {
            return $this->calibrationEnabled();
        }

        return true;
    }

    /**
     * @return list<WorkflowStage>
     */
    public function enabledStages(): array
    {
        return array_values(array_filter(
            [
                WorkflowStage::GoalSetting,
                WorkflowStage::SelfAssessment,
                WorkflowStage::ManagerReview,
                WorkflowStage::Approval,
                WorkflowStage::Calibration,
                WorkflowStage::Finalization,
            ],
            fn (WorkflowStage $stage) => $this->isStageEnabled($stage),
        ));
    }

    /**
     * Frontend / Inertia step keys (finalization → final_record).
     *
     * @return list<string>
     */
    public function enabledStepKeys(): array
    {
        return array_map(
            fn (WorkflowStage $stage) => $stage === WorkflowStage::Finalization ? 'final_record' : $stage->value,
            $this->enabledStages(),
        );
    }

    public function toSharedPayload(): array
    {
        return [
            'calibration_enabled' => $this->calibrationEnabled(),
            'enabled_stages' => $this->enabledStepKeys(),
        ];
    }

    private function settings(): ?OrganizationSetting
    {
        $organization = $this->tenantContext->organization();

        if ($organization === null) {
            return null;
        }

        return $organization->settings()->first();
    }
}
