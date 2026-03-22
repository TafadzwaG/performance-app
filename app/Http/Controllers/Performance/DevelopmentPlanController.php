<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\StoreDevelopmentPlanRequest;
use App\Models\Appraisal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DevelopmentPlanController extends Controller
{
    use BuildsPerformanceViewData;

    public function index(Request $request): Response
    {
        abort_unless($request->user()->can('performance.development_plans.view'), 403);

        $plans = Appraisal::query()
            ->with(['employeeProfile.user', 'reviewCycle', 'developmentPlan.actions.owner'])
            ->whereHas('developmentPlan')
            ->when(!$request->user()->can('performance.appraisals.view_all'), function ($query) use ($request) {
                $query->where(function ($inner) use ($request) {
                    $inner->where('employee_user_id', $request->user()->id)
                        ->orWhere('line_manager_user_id', $request->user()->id)
                        ->orWhere('approving_manager_user_id', $request->user()->id);
                });
            })
            ->latest('updated_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/development-plans/Index', [
            'plans' => $plans,
        ]);
    }

    public function show(Appraisal $appraisal): Response
    {
        $this->authorize('view', $appraisal);
        abort_unless(request()->user()->can('performance.development_plans.view'), 403);

        return Inertia::render('performance/development-plans/Show', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'userOptions' => $this->userOptions(),
        ]);
    }

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('view', $appraisal);
        abort_unless(request()->user()->can('performance.development_plans.update'), 403);

        return Inertia::render('performance/development-plans/Edit', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'userOptions' => $this->userOptions(),
        ]);
    }

    public function update(StoreDevelopmentPlanRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('view', $appraisal);
        abort_unless($request->user()->can('performance.development_plans.update'), 403);

        DB::transaction(function () use ($request, $appraisal) {
            $plan = $appraisal->developmentPlan()->updateOrCreate(
                ['appraisal_id' => $appraisal->id],
                $request->safe()->except('actions'),
            );

            $plan->actions()->delete();

            foreach ($request->validated('actions', []) as $action) {
                $plan->actions()->create($action);
            }
        });

        return to_route('performance.development_plans.show', $appraisal);
    }
}
