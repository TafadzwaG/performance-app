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

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('approve', $appraisal);

        return Inertia::render('performance/appraisals/Approval', [
            'appraisal' => $this->loadAppraisal($appraisal),
        ]);
    }

    public function store(SubmitApprovalDecisionRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('approve', $appraisal);

        $decision = $request->validated('decision');

        if ($decision === 'approve') {
            $this->workflowService->approve($appraisal, $request->user(), $request->input('comment'));
        } else {
            $this->workflowService->sendBack(
                $appraisal,
                $request->user(),
                WorkflowStage::from($request->input('reopened_stage', WorkflowStage::ManagerReview->value)),
                (string) $request->input('comment', 'Returned for updates.'),
                ApprovalStage::Approval,
                $decision === 'reject',
            );
        }

        return to_route('performance.appraisals.show', $appraisal);
    }
}
