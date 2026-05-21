<?php

namespace App\Http\Controllers\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Http\Controllers\Controller;
use App\Models\Appraisal;
use App\Models\User;
use App\Services\Performance\ReportQueryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ReportQueryService $reportQueryService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $dashboard = $this->reportQueryService->dashboard($request->user());

        $myAppraisals = $request->user()
            ->employeeProfile?->appraisals()
            ->with('reviewCycle')
            ->latest('updated_at')
            ->limit(6)
            ->get() ?? collect();

        $teamAppraisals = $request->user()
            ->managedEmployeeProfiles()
            ->with(['appraisals' => fn ($query) => $query->with('reviewCycle')->where('status', 'manager_review_pending')->latest('updated_at')])
            ->get()
            ->pluck('appraisals')
            ->flatten()
            ->take(6)
            ->values();

        $approvalQueue = $request->user()
            ->approvingEmployeeProfiles()
            ->with(['appraisals' => fn ($query) => $query->with('reviewCycle')->where('status', 'approval_pending')->latest('updated_at')])
            ->get()
            ->pluck('appraisals')
            ->flatten()
            ->take(6)
            ->values();

        $overdueQueue = $this->reportQueryService
            ->overdueReviews()
            ->load('reviewCycle')
            ->take(6)
            ->values();

        return Inertia::render('performance/dashboard/Index', [
            'dashboard' => $dashboard,
            'myAppraisals' => $myAppraisals,
            'teamPending' => $teamAppraisals,
            'approvalQueue' => $approvalQueue,
            'overdueQueue' => $overdueQueue,
            'currentGoals' => $this->currentGoalsFor($request->user()),
        ]);
    }

    private function currentGoalsFor(User $user): ?array
    {
        $appraisal = $user->employeeProfile?->appraisals()
            ->with([
                'reviewCycle',
                'objectives.perspective',
                'objectives.selfRatingLevel',
                'objectives.managerRatingLevel',
                'comments.author',
                'template.objectiveRatingScale.levels',
                'template.competencyRatingScale.levels',
            ])
            ->where('status', '!=', AppraisalStatus::Finalized->value)
            ->whereHas('reviewCycle', fn ($query) => $query->where('status', ReviewCycleStatus::Open->value))
            ->latest('updated_at')
            ->first();

        if (! $appraisal instanceof Appraisal) {
            return null;
        }

        $cycle = $appraisal->reviewCycle;

        return [
            'appraisal_id' => $appraisal->id,
            'status' => $appraisal->status?->value ?? $appraisal->status,
            'employee' => [
                'name' => $appraisal->employee_name_snapshot,
                'email' => $appraisal->employee_email_snapshot,
                'employee_number' => $appraisal->employee_number_snapshot,
                'department' => $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? null),
                'job_title' => $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? null),
            ],
            'review_cycle' => [
                'id' => $cycle?->id,
                'name' => $cycle?->name ?? $appraisal->cycle_name_snapshot,
                'code' => $cycle?->code,
                'start_date' => $cycle?->start_date?->toDateString(),
                'end_date' => $cycle?->end_date?->toDateString(),
            ],
            'review_period' => $cycle && $cycle->start_date && $cycle->end_date
                ? $cycle->start_date->format('d M Y').' - '.$cycle->end_date->format('d M Y')
                : null,
            'objectives' => $appraisal->objectives->map(fn ($objective) => [
                'id' => $objective->id,
                'perspective' => $objective->perspective?->name,
                'title' => $objective->title,
                'kpi_measure' => $objective->kpi_measure,
                'target_definition' => $objective->target_definition,
                'weight' => $objective->weight !== null ? (float) $objective->weight : null,
                'evidence_source' => $objective->evidence_source,
                'performance_achieved' => $objective->performance_achieved,
                'self_rating' => $objective->selfRatingLevel?->label ?? $objective->self_rating_score,
                'manager_rating' => $objective->managerRatingLevel?->label ?? $objective->manager_rating_score,
            ])->values(),
            'comments' => $appraisal->comments->map(fn ($comment) => [
                'id' => $comment->id,
                'type' => (string) ($comment->comment_type?->value ?? $comment->comment_type),
                'body' => $comment->body,
                'author' => $comment->author?->name,
            ])->values(),
            'rating_scales' => [
                'business' => $this->ratingScalePayload($appraisal->template?->objectiveRatingScale),
                'values' => $this->ratingScalePayload($appraisal->template?->competencyRatingScale),
            ],
        ];
    }

    private function ratingScalePayload($ratingScale): ?array
    {
        if (! $ratingScale) {
            return null;
        }

        return [
            'name' => $ratingScale->name,
            'levels' => $ratingScale->levels->map(fn ($level) => [
                'id' => $level->id,
                'label' => $level->label,
                'description' => $level->description,
                'short_label' => $level->short_label,
                'value' => $level->value !== null ? (float) $level->value : null,
                'min_percent' => $level->min_percent !== null ? (float) $level->min_percent : null,
                'max_percent' => $level->max_percent !== null ? (float) $level->max_percent : null,
            ])->values(),
        ];
    }
}
