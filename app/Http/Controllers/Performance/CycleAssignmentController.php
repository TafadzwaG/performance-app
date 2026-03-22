<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\AssignEmployeesToCycleRequest;
use App\Models\AppraisalTemplate;
use App\Models\ReviewCycle;
use App\Services\Performance\ReviewCycleAssignmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CycleAssignmentController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly ReviewCycleAssignmentService $assignmentService,
    ) {
    }

    public function edit(Request $request, ReviewCycle $reviewCycle): Response
    {
        $this->authorize('update', $reviewCycle);
        abort_unless($request->user()->can('performance.review_cycles.assign_employees'), 403);

        return Inertia::render('performance/review-cycles/AssignEmployees', [
            'reviewCycle' => $reviewCycle->loadCount('appraisals'),
            'employeeProfileOptions' => $this->employeeProfileOptions(),
            'templateOptions' => $this->templateOptions(),
        ]);
    }

    public function store(AssignEmployeesToCycleRequest $request, ReviewCycle $reviewCycle): RedirectResponse
    {
        $this->authorize('update', $reviewCycle);
        abort_unless($request->user()->can('performance.review_cycles.assign_employees'), 403);

        $template = AppraisalTemplate::query()->findOrFail($request->integer('template_id'));

        $this->assignmentService->assign(
            $reviewCycle,
            $request->validated('employee_profile_ids', []),
            $template,
            $request->user(),
        );

        return to_route('performance.review_cycles.show', $reviewCycle);
    }
}
