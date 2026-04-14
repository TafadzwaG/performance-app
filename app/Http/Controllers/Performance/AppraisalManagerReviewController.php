<?php

namespace App\Http\Controllers\Performance;

use App\Enums\ApprovalStage;
use App\Enums\WorkflowStage;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\SubmitManagerReviewRequest;
use App\Models\Appraisal;
use App\Models\RatingScaleLevel;
use App\Services\Performance\AppraisalWorkflowService;
use App\Services\Performance\AppraisalScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalManagerReviewController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalWorkflowService $workflowService,
        private readonly AppraisalScoringService $scoringService,
    ) {
    }

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('managerReview', $appraisal);

        return Inertia::render('performance/appraisals/ManagerReview', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
        ]);
    }

    public function update(SubmitManagerReviewRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('managerReview', $appraisal);

        DB::transaction(function () use ($request, $appraisal) {
            foreach ($request->validated('objectives', []) as $objectiveData) {
                $objective = $appraisal->objectives()->whereKey($objectiveData['id'])->firstOrFail();
                $level = RatingScaleLevel::query()->findOrFail($objectiveData['manager_rating_scale_level_id']);

                $objective->update([
                    'manager_comment' => $objectiveData['manager_comment'] ?? null,
                    'manager_rating_scale_level_id' => $level->id,
                    'manager_rating_score' => $level->value,
                ]);
            }

            foreach ($request->validated('competency_ratings', []) as $ratingData) {
                $rating = $appraisal->competencyRatings()->whereKey($ratingData['id'])->firstOrFail();
                $level = isset($ratingData['manager_rating_scale_level_id'])
                    ? RatingScaleLevel::query()->findOrFail($ratingData['manager_rating_scale_level_id'])
                    : null;

                $rating->update([
                    'manager_comment' => $ratingData['manager_comment'] ?? null,
                    'manager_rating_scale_level_id' => $level?->id,
                    'manager_rating_score' => $level?->value,
                ]);
            }
        });

        return to_route('performance.appraisals.manager_review', $appraisal);
    }

    public function submit(SubmitManagerReviewRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('managerReview', $appraisal);
        $this->update($request, $appraisal);

        $this->workflowService->submitManagerReview($appraisal->refresh(), request()->user(), $request->input('comment'));

        return to_route('performance.appraisals.show', $appraisal);
    }

    public function sendBack(Request $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('sendBack', $appraisal);

        $validated = $request->validate([
            'reason' => ['required', 'string'],
            'reopened_stage' => ['nullable', 'in:goal_setting,self_assessment'],
        ]);

        $this->workflowService->sendBack(
            $appraisal,
            $request->user(),
            WorkflowStage::from($validated['reopened_stage'] ?? WorkflowStage::SelfAssessment->value),
            $validated['reason'],
            ApprovalStage::ManagerReview,
        );

        return to_route('performance.appraisals.show', $appraisal);
    }

    public function recalculateScore(Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('managerReview', $appraisal);

        $this->scoringService->refresh($appraisal);

        return to_route('performance.appraisals.manager_review', $appraisal);
    }
}
