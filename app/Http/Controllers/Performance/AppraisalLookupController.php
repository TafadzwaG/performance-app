<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lightweight JSON lookup endpoints powering the async search dropdowns
 * on the appraisal create / bulk-assign screens.
 *
 * Each endpoint:
 *   - returns at most 25 results (small payload, fast roundtrip)
 *   - matches partial strings on common identifiers
 *   - returns enough metadata to render a rich result row
 */
class AppraisalLookupController extends Controller
{
    public function employees(Request $request): JsonResponse
    {
        $this->authorize('create', Appraisal::class);

        $q = trim((string) $request->string('q'));
        $excludeIds = collect(explode(',', (string) $request->string('exclude')))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->all();

        $profiles = EmployeeProfile::query()
            ->with(['user:id,name,email', 'department:id,name', 'jobTitle:id,name', 'lineManager:id,name', 'approvingManager:id,name'])
            ->when($q !== '', function (Builder $query) use ($q) {
                $query->where(function (Builder $sub) use ($q) {
                    $like = "%{$q}%";
                    $sub->where('employee_number', 'like', $like)
                        ->orWhereHas('user', fn (Builder $u) => $u->where('name', 'like', $like)->orWhere('email', 'like', $like))
                        ->orWhereHas('department', fn (Builder $d) => $d->where('name', 'like', $like))
                        ->orWhereHas('jobTitle', fn (Builder $j) => $j->where('name', 'like', $like));
                });
            })
            ->when(! empty($excludeIds), fn (Builder $query) => $query->whereNotIn('id', $excludeIds))
            ->where('is_active', true)
            ->orderBy('employee_number')
            ->limit(25)
            ->get();

        return response()->json([
            'results' => $profiles->map(fn (EmployeeProfile $p) => [
                'value' => $p->id,
                'label' => "{$p->employee_number} — ".($p->user?->name ?? 'Unknown'),
                'employee_number' => $p->employee_number,
                'name' => $p->user?->name,
                'department' => $p->department?->name,
                'job_title' => $p->jobTitle?->name,
                'has_approving_manager' => (bool) $p->approving_manager_user_id,
            ])->all(),
        ]);
    }

    public function cycles(Request $request): JsonResponse
    {
        $this->authorize('create', Appraisal::class);

        $q = trim((string) $request->string('q'));

        $cycles = ReviewCycle::query()
            ->when($q !== '', fn (Builder $query) => $query->where(function (Builder $sub) use ($q) {
                $like = "%{$q}%";
                $sub->where('name', 'like', $like)->orWhere('code', 'like', $like);
            }))
            ->orderByDesc('start_date')
            ->limit(25)
            ->get(['id', 'name', 'code', 'status', 'start_date', 'end_date']);

        return response()->json([
            'results' => $cycles->map(fn (ReviewCycle $c) => [
                'value' => $c->id,
                'label' => $c->name,
                'code' => $c->code,
                'status' => $c->status?->value ?? $c->status,
                'start_date' => optional($c->start_date)->toDateString(),
                'end_date' => optional($c->end_date)->toDateString(),
            ])->all(),
        ]);
    }

    public function templates(Request $request): JsonResponse
    {
        $this->authorize('create', Appraisal::class);

        $q = trim((string) $request->string('q'));

        $templates = AppraisalTemplate::query()
            ->when($q !== '', fn (Builder $query) => $query->where(function (Builder $sub) use ($q) {
                $like = "%{$q}%";
                $sub->where('name', 'like', $like)->orWhere('code', 'like', $like);
            }))
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(25)
            ->get(['id', 'name', 'code', 'version', 'business_weight_percent', 'values_weight_percent', 'min_objectives', 'max_objectives']);

        return response()->json([
            'results' => $templates->map(fn (AppraisalTemplate $t) => [
                'value' => $t->id,
                'label' => "{$t->name} (v{$t->version})",
                'code' => $t->code,
                'business_weight_percent' => $t->business_weight_percent,
                'values_weight_percent' => $t->values_weight_percent,
                'min_objectives' => $t->min_objectives,
                'max_objectives' => $t->max_objectives,
            ])->all(),
        ]);
    }

    /**
     * Rich detail for the panel that shows below the dropdowns once an
     * employee is selected. Different shape from the search row above.
     */
    public function employeeDetail(EmployeeProfile $employeeProfile): JsonResponse
    {
        $this->authorize('create', Appraisal::class);

        $employeeProfile->load(['user:id,name,email', 'department:id,name,code', 'jobTitle:id,name,code', 'lineManager:id,name,email', 'approvingManager:id,name,email']);

        $latestAppraisal = $employeeProfile->appraisals()
            ->with(['reviewCycle:id,name', 'template:id,name'])
            ->latest('updated_at')
            ->first();

        return response()->json([
            'profile' => [
                'id' => $employeeProfile->id,
                'employee_number' => $employeeProfile->employee_number,
                'name' => $employeeProfile->user?->name,
                'email' => $employeeProfile->user?->email,
                'department' => $employeeProfile->department?->name,
                'job_title' => $employeeProfile->jobTitle?->name,
                'employment_status' => $employeeProfile->employment_status?->value,
                'employment_type' => $employeeProfile->employment_type,
                'work_location' => $employeeProfile->work_location,
                'hire_date' => optional($employeeProfile->hire_date)->toDateString(),
                'confirmation_date' => optional($employeeProfile->confirmation_date)->toDateString(),
                'is_review_eligible' => (bool) $employeeProfile->is_review_eligible,
                'line_manager' => $employeeProfile->lineManager?->name,
                'approving_manager' => $employeeProfile->approvingManager?->name,
                'approving_manager_email' => $employeeProfile->approvingManager?->email,
                'has_approving_manager' => (bool) $employeeProfile->approving_manager_user_id,
            ],
            'latest_appraisal' => $latestAppraisal ? [
                'id' => $latestAppraisal->id,
                'cycle_name' => $latestAppraisal->reviewCycle?->name ?? $latestAppraisal->cycle_name_snapshot,
                'template_name' => $latestAppraisal->template?->name ?? $latestAppraisal->template_name_snapshot,
                'status' => $latestAppraisal->status?->value ?? $latestAppraisal->status,
                'updated_at' => optional($latestAppraisal->updated_at)->toIso8601String(),
            ] : null,
            'appraisal_count' => $employeeProfile->appraisals()->count(),
        ]);
    }
}
