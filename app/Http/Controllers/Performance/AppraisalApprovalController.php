<?php

namespace App\Http\Controllers\Performance;

use App\Enums\ApprovalStage;
use App\Enums\ApprovalAction;
use App\Enums\WorkflowStage;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\SubmitApprovalDecisionRequest;
use App\Models\Appraisal;
use App\Models\AppraisalApproval;
use App\Services\Performance\AppraisalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
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
        if ($this->alreadyApproved($appraisal)) {
            return redirect($this->afterApprovalRoute($appraisal))
                ->with('info', 'This appraisal is already approved. Proceed to finalization.');
        }

        $this->authorize('approve', $appraisal);

        return Inertia::render('performance/appraisals/Approval', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
        ]);
    }

    public function store(SubmitApprovalDecisionRequest $request, Appraisal $appraisal): RedirectResponse
    {
        if ($this->alreadyApproved($appraisal)) {
            return redirect($this->afterApprovalRoute($appraisal))
                ->with('info', 'This appraisal is already approved. Proceed to finalization.');
        }

        $this->authorize('approve', $appraisal);

        $decision = $request->validated('decision');

        try {
            if ($decision === 'approve') {
                $this->workflowService->approve($appraisal, $request->user(), $request->input('comment'));

                return redirect($this->afterApprovalRoute($appraisal))
                    ->with('success', 'Appraisal approved successfully.');
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
        } catch (ValidationException $exception) {
            if ($this->alreadyApproved($appraisal->fresh())) {
                return redirect($this->afterApprovalRoute($appraisal))
                    ->with('info', 'This appraisal is already approved. Proceed to finalization.');
            }

            throw $exception;
        }
    }

    private function alreadyApproved(Appraisal $appraisal): bool
    {
        return AppraisalApproval::query()
            ->where('appraisal_id', $appraisal->id)
            ->where('stage', ApprovalStage::Approval)
            ->where('action', ApprovalAction::Approved->value)
            ->exists();
    }

    private function afterApprovalRoute(Appraisal $appraisal): string
    {
        return request()->user()?->can('finalize', $appraisal)
            ? route('performance.appraisals.finalize', $appraisal)
            : route('performance.appraisals.show', $appraisal);
    }
}
