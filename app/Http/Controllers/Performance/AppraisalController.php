<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\ReviewCycle;
use App\Services\Performance\AppraisalNavigationService;
use App\Services\Performance\PendingAppraisalNavService;
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
        private readonly PendingAppraisalNavService $pendingAppraisalNav,
        private readonly AppraisalNavigationService $appraisalNavigation,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Appraisal::class);

        $search = (string) $request->string('search');
        $status = $request->string('status')->toString();
        $needsAction = $request->boolean('needs_action');
        $user = $request->user();

        $appraisals = Appraisal::query();
        $this->pendingAppraisalNav->applyIndexVisibleScope($appraisals, $user);

        $appraisals = $appraisals
            ->with(['reviewCycle', 'employeeProfile.user', 'template', 'overallRatingLevel'])
            ->when($search, function (Builder $query) use ($search) {
                $query->where(function (Builder $scoped) use ($search) {
                    $scoped->where('employee_name_snapshot', 'like', "%{$search}%")
                        ->orWhere('employee_number_snapshot', 'like', "%{$search}%")
                        ->orWhere('cycle_name_snapshot', 'like', "%{$search}%");
                });
            })
            ->when($status, fn (Builder $query) => $query->where('status', $status))
            ->when($needsAction, fn (Builder $query) => $this->pendingAppraisalNav->applyNeedsActionScope($query, $user))
            ->latest('updated_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/appraisals/Index', [
            'appraisals' => $appraisals,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'needs_action' => $needsAction,
            ],
            'can' => [
                'create' => $request->user()->can('performance.review_cycles.assign_employees') || $request->user()->can('performance.appraisals.view_all'),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Appraisal::class);

        // Dropdown data is now fetched on-demand via AppraisalLookupController
        // (see /performance/appraisals/lookup/...), so we no longer eager-load
        // the full catalogues here.
        return Inertia::render('performance/appraisals/Create');
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

    /**
     * Bulk-assign a single template + cycle to multiple employees in one shot.
     * Used by the "Assign to many" modal on the create screen.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $this->authorize('create', Appraisal::class);

        $validated = $request->validate([
            'review_cycle_id' => ['required', 'exists:review_cycles,id'],
            'template_id' => ['required', 'exists:appraisal_templates,id'],
            'employee_profile_ids' => ['required', 'array', 'min:1'],
            'employee_profile_ids.*' => ['integer', 'exists:employee_profiles,id'],
        ]);

        $cycle = ReviewCycle::query()->findOrFail($validated['review_cycle_id']);
        $template = AppraisalTemplate::query()->findOrFail($validated['template_id']);

        $assigned = $this->assignmentService->assign(
            $cycle,
            $validated['employee_profile_ids'],
            $template,
            $request->user(),
        );

        return to_route('performance.appraisals.index')
            ->with('success', "Assigned {$assigned->count()} appraisal".($assigned->count() === 1 ? '' : 's').' successfully.');
    }

    public function show(Appraisal $appraisal): Response|RedirectResponse
    {
        $this->authorize('view', $appraisal);

        $appraisal = $this->loadAppraisal($appraisal);

        if (! request()->boolean('overview')) {
            $continueRoute = $this->appraisalNavigation->continueRoute($appraisal, request()->user());

            if ($continueRoute) {
                return redirect($continueRoute);
            }
        }

        return Inertia::render('performance/appraisals/Show', [
            'appraisal' => $appraisal,
            'abilities' => $this->abilities($appraisal, request()->user()),
        ]);
    }

    public function stepWizard(Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('view', $appraisal);

        return to_route('performance.appraisals.plan', $appraisal);
    }

    private function abilities(Appraisal $appraisal, $user): array
    {
        return [
            'plan' => $user->can('plan', $appraisal),
            'selfAssess' => $user->can('selfAssess', $appraisal),
            'managerReview' => $user->can('managerReview', $appraisal),
            'approve' => $user->can('approve', $appraisal),
            'calibrate' => $user->can('calibrate', $appraisal),
            'finalize' => $user->can('finalize', $appraisal),
            'print' => $user->can('print', $appraisal),
            'uploadEvidence' => $user->can('uploadEvidence', $appraisal),
            'sendBack' => $user->can('sendBack', $appraisal),
        ];
    }
}
