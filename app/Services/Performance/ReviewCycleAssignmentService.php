<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
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
    ) {
    }

    public function assign(ReviewCycle $cycle, iterable $profiles, AppraisalTemplate $template, User $actor): Collection
    {
        $assigned = collect();

        DB::transaction(function () use ($cycle, $profiles, $template, $actor, &$assigned) {
            foreach (Collection::make($profiles) as $profile) {
                if (!$profile instanceof EmployeeProfile) {
                    $profile = EmployeeProfile::query()->findOrFail($profile);
                }

                if (!$profile->approving_manager_user_id) {
                    throw ValidationException::withMessages([
                        'employee_profiles' => "Employee {$profile->employee_number} must have an approving manager before assignment.",
                    ]);
                }

                $appraisal = Appraisal::firstOrCreate(
                    [
                        'review_cycle_id' => $cycle->id,
                        'employee_profile_id' => $profile->id,
                    ],
                    [
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
                    ],
                );

                $this->instantiationService->createChildren($appraisal);
                $assigned->push($appraisal);

                event(new AppraisalStatusChanged($appraisal, $actor, 'assigned'));
            }
        });

        return $assigned;
    }
}
