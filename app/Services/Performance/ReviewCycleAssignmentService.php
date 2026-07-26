<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Events\Performance\AppraisalStatusChanged;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewCycleAssignmentService
{
    public function __construct(
        private readonly AppraisalTemplateInstantiationService $instantiationService,
    ) {}

    public function assign(ReviewCycle $cycle, iterable $profiles, AppraisalTemplate $template, User $actor): Collection
    {
        if ($cycle->status !== ReviewCycleStatus::Draft) {
            throw ValidationException::withMessages([
                'review_cycle_id' => 'Manual employee assignment is only available while a cycle is draft. Use Sync Eligible Employees for an open cycle.',
            ]);
        }

        $assigned = collect();

        DB::transaction(function () use ($cycle, $profiles, $template, $actor, &$assigned) {
            foreach (Collection::make($profiles) as $profile) {
                if (! $profile instanceof EmployeeProfile) {
                    $profile = EmployeeProfile::query()->findOrFail($profile);
                }

                if (! $profile->approving_manager_user_id) {
                    throw ValidationException::withMessages([
                        'employee_profiles' => "Employee {$profile->employee_number} must have an approving manager before assignment.",
                    ]);
                }

                $existingAppraisal = Appraisal::query()
                    ->where('review_cycle_id', $cycle->id)
                    ->where('employee_profile_id', $profile->id)
                    ->first();

                if ($existingAppraisal) {
                    $appraisal = $existingAppraisal;
                    $wasRecentlyCreated = false;
                } else {
                    $appraisal = Appraisal::query()->create([
                        'review_cycle_id' => $cycle->id,
                        'employee_profile_id' => $profile->id,
                        'template_id' => $template->id,
                        'employee_user_id' => $profile->user_id,
                        'line_manager_user_id' => $profile->line_manager_user_id,
                        'approving_manager_user_id' => $profile->approving_manager_user_id,
                        'status' => $cycle->status?->value === 'open' ? AppraisalStatus::GoalSetting : AppraisalStatus::Draft,
                        'business_weight_percent' => $template->business_weight_percent,
                        'values_weight_percent' => $template->values_weight_percent,
                        'employee_name_snapshot' => $profile->user?->name ?? 'Unknown employee',
                        'employee_email_snapshot' => $profile->user?->email ?? 'unknown@example.com',
                        'employee_number_snapshot' => $profile->employee_number,
                        'department_name_snapshot' => $profile->department?->name,
                        'job_title_name_snapshot' => $profile->jobTitle?->name,
                        'cycle_name_snapshot' => $cycle->name,
                        'template_name_snapshot' => $template->name,
                    ]);
                    $wasRecentlyCreated = true;
                }

                $this->instantiationService->createChildren($appraisal);
                $assigned->push($appraisal);

                if ($wasRecentlyCreated) {
                    event(new AppraisalStatusChanged($appraisal, $actor, 'assigned'));
                }
            }
        });

        return $assigned;
    }
}
