<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\ReviewCycle;
use App\Services\Performance\ReviewCycleAssignmentService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly ReviewCycleAssignmentService $assignmentService,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Appraisal::class);

        $search = (string) $request->string('search');
        $status = $request->string('status')->toString();

        $appraisals = $this->visibleAppraisals($request->user())
            ->with(['reviewCycle', 'employeeProfile.user', 'template', 'overallRatingLevel'])
            ->when($search, function (Builder $query) use ($search) {
                $query->where('employee_name_snapshot', 'like', "%{$search}%")
                    ->orWhere('employee_number_snapshot', 'like', "%{$search}%")
                    ->orWhere('cycle_name_snapshot', 'like', "%{$search}%");
            })
            ->when($status, fn (Builder $query) => $query->where('status', $status))
            ->latest('updated_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/appraisals/Index', [
            'appraisals' => $appraisals,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'can' => [
                'create' => $request->user()->can('performance.review_cycles.assign_employees') || $request->user()->can('performance.appraisals.view_all'),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Appraisal::class);

        return Inertia::render('performance/appraisals/Create', [
            'reviewCycleOptions' => $this->reviewCycleOptions(),
            'employeeProfileOptions' => $this->employeeProfileOptions(),
            'templateOptions' => $this->templateOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Appraisal::class);

        $validated = $request->validate([
            'review_cycle_id' => ['required', 'exists:review_cycles,id'],
            'employee_profile_id' => ['required', 'exists:employee_profiles,id'],
            'template_id' => ['required', 'exists:appraisal_templates,id'],
        ]);

        $cycle = ReviewCycle::query()->findOrFail($validated['review_cycle_id']);
        $template = AppraisalTemplate::query()->findOrFail($validated['template_id']);
        $appraisal = $this->assignmentService
            ->assign($cycle, [$validated['employee_profile_id']], $template, $request->user())
            ->first();

        return to_route('performance.appraisals.show', $appraisal);
    }

    public function show(Appraisal $appraisal): Response
    {
        $this->authorize('view', $appraisal);

        return Inertia::render('performance/appraisals/Show', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'abilities' => $this->abilities($appraisal, request()->user()),
        ]);
    }

    private function visibleAppraisals($user): Builder
    {
        return Appraisal::query()->where(function (Builder $query) use ($user) {
            if ($user->can('performance.appraisals.view_all')) {
                $query->whereRaw('1 = 1');

                return;
            }

            $query->when($user->can('performance.appraisals.view_own'), fn (Builder $builder) => $builder->orWhere('employee_user_id', $user->id))
                ->when($user->can('performance.appraisals.manager_review'), fn (Builder $builder) => $builder->orWhere('line_manager_user_id', $user->id))
                ->when($user->can('performance.appraisals.approve'), fn (Builder $builder) => $builder->orWhere('approving_manager_user_id', $user->id))
                ->when($user->can('performance.appraisals.finalize'), fn (Builder $builder) => $builder->orWhereNotNull('id'));
        });
    }

    private function abilities(Appraisal $appraisal, $user): array
    {
        return [
            'plan' => $user->can('plan', $appraisal),
            'selfAssess' => $user->can('selfAssess', $appraisal),
            'managerReview' => $user->can('managerReview', $appraisal),
            'approve' => $user->can('approve', $appraisal),
            'finalize' => $user->can('finalize', $appraisal),
            'print' => $user->can('print', $appraisal),
            'uploadEvidence' => $user->can('uploadEvidence', $appraisal),
            'sendBack' => $user->can('sendBack', $appraisal),
        ];
    }
}
