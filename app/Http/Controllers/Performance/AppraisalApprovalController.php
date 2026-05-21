<?php

namespace App\Http\Controllers\Performance;

use App\Enums\ApprovalStage;
use App\Enums\WorkflowStage;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\SubmitApprovalDecisionRequest;
use App\Models\Appraisal;
use App\Models\User;
use App\Services\Performance\AppraisalNavigationService;
use App\Services\Performance\AppraisalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalApprovalController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalWorkflowService $workflowService,
        private readonly AppraisalNavigationService $appraisalNavigation,
    ) {}

    public function edit(Appraisal $appraisal): Response|RedirectResponse
    {
        $this->authorize('viewApproval', $appraisal);

        return Inertia::render('performance/appraisals/Approval', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
        ]);
    }

    public function store(SubmitApprovalDecisionRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('approve', $appraisal);

        $decision = $request->validated('decision');

        if ($decision === 'approve') {
            $this->workflowService->approve($appraisal, $request->user(), $request->input('comment'));

            return redirect($this->afterApprovalRoute($appraisal))
                ->with('success', 'Appraisal approved successfully and sent to calibration.');
        }

        $reopenedStage = WorkflowStage::from($request->input('reopened_stage', WorkflowStage::ManagerReview->value));

        $this->workflowService->sendBack(
            $appraisal,
            $request->user(),
            $reopenedStage,
            (string) $request->input('comment', 'Returned for updates.'),
            ApprovalStage::Approval,
            $decision === 'reject',
        );

        $actor = $request->user();

        return redirect($this->appraisalNavigation->afterSendBackRoute($appraisal, $actor, $reopenedStage))
            ->with('success', $this->sendBackSuccessMessage($decision, $reopenedStage, $appraisal, $actor));
    }

    private function sendBackSuccessMessage(string $decision, WorkflowStage $reopenedStage, Appraisal $appraisal, User $actor): string
    {
        $stageLabel = str_replace('_', ' ', $reopenedStage->value);

        if ($this->appraisalNavigation->canOpenWorkflowStage($appraisal, $actor, $reopenedStage)) {
            return $decision === 'reject'
                ? 'Appraisal rejected and returned for updates.'
                : 'Appraisal sent back for updates.';
        }

        return $decision === 'reject'
            ? "Appraisal rejected and reopened at {$stageLabel}. The assignee will continue from that step."
            : "Appraisal sent back to {$stageLabel}. The assignee will continue from that step.";
    }

    private function afterApprovalRoute(Appraisal $appraisal): string
    {
        return request()->user()?->can('calibrate', $appraisal->fresh())
            ? route('performance.appraisals.calibration', $appraisal)
            : route('performance.appraisals.show', $appraisal);
    }
}
