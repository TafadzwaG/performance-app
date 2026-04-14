<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\UpdateGoalPlanRequest;
use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Services\Performance\AppraisalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalPlanController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalWorkflowService $workflowService,
    ) {
    }

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('plan', $appraisal);

        return Inertia::render('performance/appraisals/Plan', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->appraisalAbilities($appraisal, request()->user()),
            'perspectiveOptions' => $this->perspectiveOptions(),
            'goalLibraryItems' => $appraisal->employeeProfile
                ?->department
                ?->goalLibraryItems()
                ->with('perspective')
                ->get() ?? [],
        ]);
    }

    public function update(UpdateGoalPlanRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('plan', $appraisal);

        DB::transaction(function () use ($request, $appraisal) {
            $keptIds = [];

            foreach ($request->validated('objectives', []) as $index => $objectiveData) {
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
                    'sort_order' => $index,
                ])->save();

                $keptIds[] = $objective->id;
            }

            $appraisal->objectives()->whereNotIn('id', $keptIds)->delete();
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
