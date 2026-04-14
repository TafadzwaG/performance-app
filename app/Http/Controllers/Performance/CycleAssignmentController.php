<?php

namespace App\Http\Controllers\Performance;

use App\Enums\AppraisalStatus;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\AssignEmployeesToCycleRequest;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use App\Services\Performance\ReviewCycleAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
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

    public function employeeOptions(Request $request, ReviewCycle $reviewCycle): JsonResponse
    {
        $this->authorize('update', $reviewCycle);
        abort_unless($request->user()->can('performance.review_cycles.assign_employees'), 403);

        $search = trim((string) $request->query('search', ''));
        $scope = (string) $request->query('scope', 'available');
        $limit = min(max((int) $request->query('limit', 40), 10), 100);
        $assignedProfileIds = $reviewCycle->appraisals()->pluck('employee_profile_id');

        if ($scope === 'assigned') {
            $options = $reviewCycle->appraisals()
                ->with(['employeeProfile.user:id,name,email', 'employeeProfile.department:id,name', 'employeeProfile.jobTitle:id,name'])
                ->when($search !== '', function ($query) use ($search) {
                    $like = "%{$search}%";

                    $query->where(function ($builder) use ($like) {
                        $builder
                            ->where('employee_number_snapshot', 'like', $like)
                            ->orWhere('employee_name_snapshot', 'like', $like)
                            ->orWhere('employee_email_snapshot', 'like', $like)
                            ->orWhere('department_name_snapshot', 'like', $like)
                            ->orWhere('job_title_name_snapshot', 'like', $like);
                    });
                })
                ->orderBy('employee_number_snapshot')
                ->limit($limit)
                ->get()
                ->map(fn (Appraisal $appraisal) => [
                    'value' => $appraisal->employee_profile_id,
                    'label' => "{$appraisal->employee_number_snapshot} - {$appraisal->employee_name_snapshot}",
                    'employee_number' => $appraisal->employee_number_snapshot,
                    'department' => $appraisal->department_name_snapshot,
                    'job_title' => $appraisal->job_title_name_snapshot,
                    'appraisal_id' => $appraisal->id,
                    'status' => $appraisal->status?->value ?? $appraisal->status,
                    'can_remove' => $this->canRemoveAssignment($appraisal),
                ])
                ->values()
                ->all();
        } else {
            $options = EmployeeProfile::query()
                ->with(['user:id,name,email', 'department:id,name', 'jobTitle:id,name'])
                ->whereNotIn('id', $assignedProfileIds)
                ->when($search !== '', function ($query) use ($search) {
                    $like = "%{$search}%";

                    $query->where(function ($builder) use ($like) {
                        $builder
                            ->where('employee_number', 'like', $like)
                            ->orWhereHas('user', fn ($userQuery) => $userQuery
                                ->where('name', 'like', $like)
                                ->orWhere('email', 'like', $like)
                            )
                            ->orWhereHas('department', fn ($departmentQuery) => $departmentQuery->where('name', 'like', $like))
                            ->orWhereHas('jobTitle', fn ($jobTitleQuery) => $jobTitleQuery->where('name', 'like', $like));
                    });
                })
                ->orderBy('employee_number')
                ->limit($limit)
                ->get()
                ->map(fn (EmployeeProfile $profile) => [
                    'value' => $profile->id,
                    'label' => "{$profile->employee_number} - {$profile->user?->name}",
                    'employee_number' => $profile->employee_number,
                    'department' => $profile->department?->name,
                    'job_title' => $profile->jobTitle?->name,
                    'approving_manager_user_id' => $profile->approving_manager_user_id,
                ])
                ->values()
                ->all();
        }

        return response()->json([
            'data' => $options,
            'counts' => [
                'assigned' => $assignedProfileIds->count(),
                'available' => EmployeeProfile::query()->whereNotIn('id', $assignedProfileIds)->count(),
            ],
        ]);
    }

    public function destroy(Request $request, ReviewCycle $reviewCycle, Appraisal $appraisal): JsonResponse
    {
        $this->authorize('update', $reviewCycle);
        abort_unless($request->user()->can('performance.review_cycles.assign_employees'), 403);

        if ((int) $appraisal->review_cycle_id !== (int) $reviewCycle->id) {
            abort(404);
        }

        if (!$this->canRemoveAssignment($appraisal)) {
            throw ValidationException::withMessages([
                'employee_profile_ids' => 'This employee has already started the appraisal and cannot be removed.',
            ]);
        }

        $appraisal->delete();

        return response()->json([
            'message' => 'Employee removed from cycle assignment.',
        ]);
    }

    private function canRemoveAssignment(Appraisal $appraisal): bool
    {
        $status = $appraisal->status?->value ?? $appraisal->status;

        return in_array($status, [
            AppraisalStatus::Draft->value,
            AppraisalStatus::GoalSetting->value,
            AppraisalStatus::SelfAssessmentPending->value,
        ], true)
            && !$appraisal->goal_submitted_at
            && !$appraisal->self_assessment_submitted_at
            && !$appraisal->manager_reviewed_at
            && !$appraisal->approved_at
            && !$appraisal->finalized_at;
    }
}
