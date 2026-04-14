<?php

namespace App\Http\Controllers\Performance;

use App\Enums\CommentType;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\SubmitSelfAssessmentRequest;
use App\Models\Appraisal;
use App\Models\RatingScaleLevel;
use App\Services\Performance\AppraisalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalSelfAssessmentController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalWorkflowService $workflowService,
    ) {
    }

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('selfAssess', $appraisal);

        return Inertia::render('performance/appraisals/SelfAssessment', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
        ]);
    }

    public function update(SubmitSelfAssessmentRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('selfAssess', $appraisal);

        DB::transaction(function () use ($request, $appraisal) {
            foreach ($request->validated('objectives', []) as $objectiveData) {
                $objective = $appraisal->objectives()->whereKey($objectiveData['id'])->firstOrFail();
                $level = RatingScaleLevel::query()->findOrFail($objectiveData['self_rating_scale_level_id']);

                $objective->update([
                    'performance_achieved' => $objectiveData['performance_achieved'],
                    'employee_comment' => $objectiveData['employee_comment'] ?? null,
                    'self_rating_scale_level_id' => $level->id,
                    'self_rating_score' => $level->value,
                ]);
            }

            foreach ($request->validated('competency_ratings', []) as $ratingData) {
                $rating = $appraisal->competencyRatings()->whereKey($ratingData['id'])->firstOrFail();
                $level = isset($ratingData['self_rating_scale_level_id'])
                    ? RatingScaleLevel::query()->findOrFail($ratingData['self_rating_scale_level_id'])
                    : null;

                $rating->update([
                    'employee_comment' => $ratingData['employee_comment'] ?? null,
                    'self_rating_scale_level_id' => $level?->id,
                    'self_rating_score' => $level?->value,
                ]);
            }

            $this->upsertComment($appraisal, CommentType::AchievementNote, $request->input('achievement_note'));
            $this->upsertComment($appraisal, CommentType::SignificantIssue, $request->input('significant_issue'));
        });

        return to_route('performance.appraisals.self_assessment', $appraisal);
    }

    public function submit(Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('selfAssess', $appraisal);

        $this->workflowService->submitSelfAssessment($appraisal, request()->user());

        return to_route('performance.appraisals.show', $appraisal);
    }

    private function upsertComment(Appraisal $appraisal, CommentType $type, ?string $body): void
    {
        if (blank($body)) {
            $appraisal->comments()
                ->where('author_user_id', request()->user()->id)
                ->where('comment_type', $type)
                ->whereNull('appraisal_objective_id')
                ->delete();

            return;
        }

        $appraisal->comments()->updateOrCreate(
            [
                'author_user_id' => request()->user()->id,
                'comment_type' => $type,
                'appraisal_objective_id' => null,
            ],
            ['body' => $body],
        );
    }
}
