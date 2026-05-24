<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\UpdateGoalPlanRequest;
use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Services\Performance\AppraisalWorkflowService;
use App\Services\Performance\GoalLibraryLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalPlanController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalWorkflowService $workflowService,
        private readonly GoalLibraryLookupService $goalLibraryLookupService,
    ) {}

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('viewPlan', $appraisal);

        return Inertia::render('performance/appraisals/GoalSetting', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'goalLibrarySearchEndpoint' => route('performance.appraisals.plan.goal_library', $appraisal),
        ]);
    }

    public function goalLibrary(Request $request, Appraisal $appraisal): JsonResponse
    {
        $this->authorize('viewPlan', $appraisal);

        $excludeIds = collect(preg_split('/\s*,\s*/', (string) $request->string('exclude'), -1, PREG_SPLIT_NO_EMPTY) ?: [])
            ->map(fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        return response()->json([
            'results' => $this->goalLibraryLookupService->searchForAppraisal(
                $appraisal,
                (string) $request->string('q'),
                excludeIds: $excludeIds,
            ),
        ]);
    }

    public function update(UpdateGoalPlanRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('plan', $appraisal);

        DB::transaction(function () use ($request, $appraisal) {
            $objectives = $request->validated('objectives', []);
            $incomingIds = collect($objectives)
                ->pluck('id')
                ->filter()
                ->map(static fn ($id) => (int) $id)
                ->values();

            // Remove rows no longer present before re-sequencing to avoid unique collisions.
            if ($incomingIds->isEmpty()) {
                $appraisal->objectives()->delete();
            } else {
                $appraisal->objectives()->whereNotIn('id', $incomingIds)->delete();
            }

            // Move remaining rows out of the target range so we can safely assign final sort_order values.
            $appraisal->objectives()->increment('sort_order', 1000);

            foreach ($objectives as $index => $objectiveData) {
                $objective = isset($objectiveData['id'])
                    ? $appraisal->objectives()->whereKey($objectiveData['id'])->firstOrFail()
                    : new AppraisalObjective(['appraisal_id' => $appraisal->id]);

                $objective->fill([
                    'template_item_id' => null,
                    'goal_library_item_id' => $objectiveData['goal_library_item_id'] ?? null,
                    'perspective_id' => $objectiveData['perspective_id'],
                    'objective_type' => $objectiveData['objective_type'] ?? 'business',
                    'title' => $objectiveData['title'],
                    'kpi_measure' => $objectiveData['kpi_measure'] ?? null,
                    'target_definition' => $objectiveData['target_definition'] ?? null,
                    'weight' => $objectiveData['weight'],
                    'evidence_source' => $objectiveData['evidence_source'] ?? null,
                    'due_date' => $objectiveData['due_date'] ?? null,
                    'include_in_business_score' => (bool) ($objectiveData['include_in_business_score'] ?? true),
                    'sort_order' => $index + 1,
                ])->save();
            }
        });

        return to_route('performance.appraisals.plan', $appraisal);
    }

    public function submit(Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('plan', $appraisal);

        $this->workflowService->submitGoalPlan($appraisal, request()->user());

        return to_route('performance.appraisals.show', $appraisal);
    }
}
