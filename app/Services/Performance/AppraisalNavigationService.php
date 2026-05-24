<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\WorkflowStage;
use App\Models\Appraisal;
use App\Models\DevelopmentPlan;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class AppraisalNavigationService
{
    public function hasMeaningfulGoals(Appraisal $appraisal): bool
    {
        $appraisal->loadMissing('objectives');

        return $appraisal->objectives->contains(function ($objective) {
            $title = trim((string) $objective->title);

            if ($title === '' || preg_match('/^Objective\s+\d+$/i', $title)) {
                return false;
            }

            return true;
        });
    }

    public function continueRoute(Appraisal $appraisal, User $user): ?string
    {
        $appraisal->loadMissing('objectives', 'developmentPlan');
        $hasGoals = $this->hasMeaningfulGoals($appraisal);

        $abilities = [
            'plan' => $user->can('plan', $appraisal),
            'selfAssess' => $user->can('selfAssess', $appraisal),
            'managerReview' => $user->can('managerReview', $appraisal),
            'approve' => $user->can('approve', $appraisal),
            'calibrate' => $user->can('calibrate', $appraisal),
            'finalize' => $user->can('finalize', $appraisal),
        ];

        $canOpenDevelopmentPlan = $user->can('performance.development_plans.view')
            || $user->can('performance.development_plans.update');

        foreach ($this->steps($appraisal, $abilities, $hasGoals, $canOpenDevelopmentPlan) as $step) {
            if (! $step['is_complete'] && $step['can_open']) {
                return $step['route'];
            }
        }

        if ($appraisal->status === AppraisalStatus::Finalized) {
            if ($this->canAccessDevelopmentPlanEditor($appraisal, $user)) {
                return route('performance.development_plans.edit', $appraisal);
            }

            if ($user->can('viewFinalize', $appraisal)) {
                return route('performance.appraisals.finalize', $appraisal);
            }

            return null;
        }

        return null;
    }

    public function afterStepSubmitRoute(Appraisal $appraisal, User $user): string
    {
        $appraisal->refresh();

        return $this->continueRoute($appraisal, $user)
            ?? route('performance.appraisals.show', $appraisal);
    }

    private function canAccessDevelopmentPlanEditor(Appraisal $appraisal, User $user): bool
    {
        if (! $user->can('performance.development_plans.view')) {
            return false;
        }

        return Gate::forUser($user)->allows('manage', [DevelopmentPlan::class, $appraisal])
            || Gate::forUser($user)->allows('progress', [DevelopmentPlan::class, $appraisal]);
    }

    public function afterSendBackRoute(Appraisal $appraisal, User $user, WorkflowStage $reopenedStage): string
    {
        $appraisal->refresh();

        if ($this->canEditWorkflowStage($appraisal, $user, $reopenedStage)) {
            return $this->routeForWorkflowStage($appraisal, $reopenedStage);
        }

        return route('performance.appraisals.show', [
            'appraisal' => $appraisal,
            'overview' => 1,
        ]);
    }

    public function canOpenWorkflowStage(Appraisal $appraisal, User $user, WorkflowStage $stage): bool
    {
        return match ($stage) {
            WorkflowStage::GoalSetting => $user->can('viewPlan', $appraisal),
            WorkflowStage::SelfAssessment => $user->can('viewSelfAssessment', $appraisal),
            WorkflowStage::ManagerReview => $user->can('viewManagerReview', $appraisal),
            WorkflowStage::Approval => $user->can('viewApproval', $appraisal),
            WorkflowStage::Calibration => $user->can('viewCalibrate', $appraisal),
            WorkflowStage::Finalization => $user->can('viewFinalize', $appraisal),
        };
    }

    public function canEditWorkflowStage(Appraisal $appraisal, User $user, WorkflowStage $stage): bool
    {
        return match ($stage) {
            WorkflowStage::GoalSetting => $user->can('plan', $appraisal),
            WorkflowStage::SelfAssessment => $user->can('selfAssess', $appraisal),
            WorkflowStage::ManagerReview => $user->can('managerReview', $appraisal),
            WorkflowStage::Approval => $user->can('approve', $appraisal),
            WorkflowStage::Calibration => $user->can('calibrate', $appraisal),
            WorkflowStage::Finalization => $user->can('finalize', $appraisal),
        };
    }

    public function routeForWorkflowStage(Appraisal $appraisal, WorkflowStage $stage): string
    {
        return match ($stage) {
            WorkflowStage::GoalSetting => route('performance.appraisals.plan', $appraisal),
            WorkflowStage::SelfAssessment => route('performance.appraisals.self_assessment', $appraisal),
            WorkflowStage::ManagerReview => route('performance.appraisals.manager_review', $appraisal),
            WorkflowStage::Approval => route('performance.appraisals.approval', $appraisal),
            WorkflowStage::Calibration => route('performance.appraisals.calibration', $appraisal),
            WorkflowStage::Finalization => route('performance.appraisals.finalize', $appraisal),
        };
    }

    /**
     * @return list<array{key: string, is_complete: bool, can_open: bool, route: string}>
     */
    private function steps(Appraisal $appraisal, array $abilities, bool $hasGoals, bool $canOpenDevelopmentPlan): array
    {
        $sentBackTo = $appraisal->status?->value === 'sent_back'
            ? $appraisal->reopened_stage?->value
            : null;

        return [
            [
                'key' => 'goal_setting',
                'is_complete' => $this->isGoalSettingComplete($appraisal, $hasGoals, $sentBackTo),
                'can_open' => (bool) ($abilities['plan'] ?? false),
                'route' => route('performance.appraisals.plan', $appraisal),
            ],
            [
                'key' => 'self_assessment',
                'is_complete' => $this->isSelfAssessmentComplete($appraisal, $sentBackTo),
                'can_open' => (bool) ($abilities['selfAssess'] ?? false),
                'route' => route('performance.appraisals.self_assessment', $appraisal),
            ],
            [
                'key' => 'manager_review',
                'is_complete' => $this->isManagerReviewComplete($appraisal, $sentBackTo),
                'can_open' => (bool) ($abilities['managerReview'] ?? false),
                'route' => route('performance.appraisals.manager_review', $appraisal),
            ],
            [
                'key' => 'approval',
                'is_complete' => $this->isApprovalComplete($appraisal, $sentBackTo),
                'can_open' => (bool) ($abilities['approve'] ?? false),
                'route' => route('performance.appraisals.approval', $appraisal),
            ],
            [
                'key' => 'calibration',
                'is_complete' => (bool) $appraisal->calibrated_at,
                'can_open' => (bool) ($abilities['calibrate'] ?? false),
                'route' => route('performance.appraisals.calibration', $appraisal),
            ],
            [
                'key' => 'final_record',
                'is_complete' => $appraisal->status?->value === 'finalized',
                'can_open' => (bool) (($abilities['finalize'] ?? false) || ($appraisal->status?->value === 'finalized' && $canOpenDevelopmentPlan)),
                'route' => $appraisal->status?->value === 'finalized'
                    ? route('performance.development_plans.edit', $appraisal)
                    : route('performance.appraisals.finalize', $appraisal),
            ],
        ];
    }

    private function isGoalSettingComplete(Appraisal $appraisal, bool $hasGoals, ?string $sentBackTo): bool
    {
        if ($sentBackTo === 'goal_setting') {
            return false;
        }

        if ($appraisal->goal_submitted_at) {
            return true;
        }

        return $hasGoals && ! in_array($appraisal->status?->value, ['draft', 'goal_setting'], true);
    }

    private function isSelfAssessmentComplete(Appraisal $appraisal, ?string $sentBackTo): bool
    {
        if ($sentBackTo === 'self_assessment') {
            return false;
        }

        return (bool) $appraisal->self_assessment_submitted_at;
    }

    private function isManagerReviewComplete(Appraisal $appraisal, ?string $sentBackTo): bool
    {
        if ($appraisal->status === AppraisalStatus::ManagerReviewPending) {
            return false;
        }

        if (in_array($sentBackTo, ['manager_review', 'self_assessment', 'goal_setting'], true)) {
            return false;
        }

        return (bool) $appraisal->manager_reviewed_at;
    }

    private function isApprovalComplete(Appraisal $appraisal, ?string $sentBackTo): bool
    {
        if ($sentBackTo === 'approval') {
            return false;
        }

        return (bool) $appraisal->approved_at;
    }
}
