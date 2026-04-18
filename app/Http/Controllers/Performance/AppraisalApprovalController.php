<?php

namespace App\Http\Controllers\Performance;

use App\Enums\ApprovalStage;
use App\Enums\WorkflowStage;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\SubmitApprovalDecisionRequest;
use App\Models\Appraisal;
use App\Services\Performance\AppraisalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalApprovalController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalWorkflowService $workflowService,
    ) {
    }

    public function edit(Appraisal $appraisal): Response|RedirectResponse
    {
        $this->authorize('approve', $appraisal);

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

        $this->workflowService->sendBack(
            $appraisal,
            $request->user(),
            WorkflowStage::from($request->input('reopened_stage', WorkflowStage::ManagerReview->value)),
            (string) $request->input('comment', 'Returned for updates.'),
            ApprovalStage::Approval,
            $decision === 'reject',
        );

        return to_route('performance.appraisals.show', $appraisal)
            ->with('success', 'Decision submitted successfully.');
    }

    private function afterApprovalRoute(Appraisal $appraisal): string
    {
        return request()->user()?->can('calibrate', $appraisal->fresh())
            ? route('performance.appraisals.calibration', $appraisal)
            : route('performance.appraisals.show', $appraisal);
    }
}
