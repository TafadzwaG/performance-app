<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\StoreDevelopmentPlanRequest;
use App\Models\Appraisal;
use App\Models\DevelopmentPlan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
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
        $canManagePlan = Gate::forUser(request()->user())->allows('manage', [DevelopmentPlan::class, $appraisal]);
        $canUpdateProgress = Gate::forUser(request()->user())->allows('progress', [DevelopmentPlan::class, $appraisal]);

        return Inertia::render('performance/development-plans/Show', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'userOptions' => $this->ownerOptions($appraisal),
            'abilities' => [
                'canManagePlan' => $canManagePlan,
                'canUpdateProgress' => $canUpdateProgress,
            ],
        ]);
    }

    public function edit(Appraisal $appraisal): Response
    {
        $this->authorize('view', $appraisal);
        $canManagePlan = Gate::forUser(request()->user())->allows('manage', [DevelopmentPlan::class, $appraisal]);
        $canUpdateProgress = Gate::forUser(request()->user())->allows('progress', [DevelopmentPlan::class, $appraisal]);

        abort_unless($canManagePlan || $canUpdateProgress, 403);

        return Inertia::render('performance/development-plans/Edit', [
            'appraisal' => $this->loadAppraisal($appraisal),
            'userOptions' => $this->ownerOptions($appraisal),
            'abilities' => [
                'canManagePlan' => $canManagePlan,
                'canUpdateProgress' => $canUpdateProgress,
            ],
        ]);
    }

    public function update(StoreDevelopmentPlanRequest $request, Appraisal $appraisal): RedirectResponse
    {
        $this->authorize('view', $appraisal);
        $canManagePlan = Gate::forUser($request->user())->allows('manage', [DevelopmentPlan::class, $appraisal]);
        $canUpdateProgress = Gate::forUser($request->user())->allows('progress', [DevelopmentPlan::class, $appraisal]);

        abort_unless($canManagePlan || $canUpdateProgress, 403);

        DB::transaction(function () use ($request, $appraisal, $canManagePlan) {
            $validated = $request->validated();
            $plan = $appraisal->developmentPlan()->firstOrCreate(['appraisal_id' => $appraisal->id]);

            if ($canManagePlan) {
                $plan->fill([
                    'strengths' => $validated['strengths'] ?? null,
                    'improvement_areas' => $validated['improvement_areas'] ?? null,
                    'follow_up_notes' => $validated['follow_up_notes'] ?? null,
                ])->save();

                $plan->actions()->delete();

                foreach (($validated['actions'] ?? []) as $action) {
                    $plan->actions()->create([
                        'action' => $action['action'],
                        'owner_user_id' => $action['owner_user_id'] ?? null,
                        'due_date' => $action['due_date'] ?? null,
                        'status' => $action['status'] ?? 'pending',
                        'follow_up_status' => $action['follow_up_status'] ?? null,
                        'completed_at' => ($action['status'] ?? null) === 'completed' ? now() : null,
                    ]);
                }

                return;
            }

            $plan->fill([
                'follow_up_notes' => $validated['follow_up_notes'] ?? $plan->follow_up_notes,
            ])->save();

            $submittedActionIds = collect($validated['actions'] ?? [])
                ->pluck('id')
                ->filter()
                ->map(static fn ($id) => (int) $id)
                ->values();

            if ($submittedActionIds->isNotEmpty()) {
                $existingIds = $plan->actions()
                    ->whereIn('id', $submittedActionIds)
                    ->pluck('id')
                    ->map(static fn ($id) => (int) $id);

                if ($existingIds->count() !== $submittedActionIds->count()) {
                    throw ValidationException::withMessages([
                        'actions' => 'One or more development actions are invalid for this appraisal plan.',
                    ]);
                }
            }

            foreach (($validated['actions'] ?? []) as $action) {
                $planAction = $plan->actions()->whereKey($action['id'])->first();

                if (!$planAction) {
                    continue;
                }

                $nextStatus = $action['status'] ?? $planAction->status?->value ?? $planAction->status;
                $planAction->fill([
                    'status' => $nextStatus,
                    'follow_up_status' => $action['follow_up_status'] ?? null,
                    'completed_at' => $nextStatus === 'completed' ? now() : null,
                ])->save();
            }
        });

        return to_route('performance.development_plans.show', $appraisal);
    }

    private function ownerOptions(Appraisal $appraisal): array
    {
        return User::query()
            ->with(['employeeProfile:id,user_id,employee_number'])
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(function (User $user) use ($appraisal) {
                $employeeNumber = $user->employeeProfile?->employee_number;
                $isAppraisalOwner = $user->id === $appraisal->employee_user_id;
                $isLineManager = $user->id === $appraisal->line_manager_user_id;

                $roleHints = [];
                if ($isAppraisalOwner) {
                    $roleHints[] = 'Appraisal Owner';
                }
                if ($isLineManager) {
                    $roleHints[] = 'Line Manager';
                }

                $baseLabel = trim(($employeeNumber ? "{$employeeNumber} - " : '') . $user->name);
                $label = count($roleHints) > 0
                    ? "{$baseLabel} (" . implode(' | ', $roleHints) . ')'
                    : $baseLabel;

                return [
                    'value' => $user->id,
                    'label' => $label,
                    'email' => $user->email,
                    'employee_number' => $employeeNumber,
                    'is_appraisal_owner' => $isAppraisalOwner,
                    'is_line_manager' => $isLineManager,
                ];
            })
            ->sortBy([
                ['is_appraisal_owner', 'desc'],
                ['is_line_manager', 'desc'],
                ['label', 'asc'],
            ])
            ->values()
            ->all();
    }
}
