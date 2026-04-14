<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\FinalizeAppraisalRequest;
use App\Models\Appraisal;
use App\Services\Performance\AppraisalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalFinalizeController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalWorkflowService $workflowService,
    ) {
    }

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('finalize', $appraisal);

        return Inertia::render('performance/appraisals/Finalize', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
        ]);
    }

    public function store(FinalizeAppraisalRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('finalize', $appraisal);

        $this->workflowService->finalize($appraisal, $request->user(), $request->input('comment'));

        return to_route('performance.appraisals.show', $appraisal);
    }
}
