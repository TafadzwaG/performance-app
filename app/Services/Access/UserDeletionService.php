<?php

namespace App\Services\Access;

use App\Models\Appraisal;
use App\Models\AppraisalApproval;
use App\Models\AppraisalCalibration;
use App\Models\AppraisalCalibrationEvidence;
use App\Models\AppraisalComment;
use App\Models\AppraisalCompetencyRating;
use App\Models\AppraisalObjective;
use App\Models\AppraisalObjectiveEvidence;
use App\Models\AppraisalStatusHistory;
use App\Models\AuditTrail;
use App\Models\DevelopmentPlan;
use App\Models\DevelopmentPlanAction;
use App\Models\EmployeeProfile;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class UserDeletionService
{
    /**
     * @return array<string, mixed>
     */
    public function impact(User $user): array
    {
        $profileId = EmployeeProfile::withTrashed()
            ->where('user_id', $user->id)
            ->value('id');

        $appraisalIds = $this->employeeAppraisalIds($user, $profileId);

        $evidenceFiles = $this->countEvidenceFiles($appraisalIds)
            + AppraisalCalibrationEvidence::query()
                ->where('uploaded_by_user_id', $user->id)
                ->where('evidence_type', 'file')
                ->whereNotNull('path')
                ->count();

        $managedAsLineManager = EmployeeProfile::query()
            ->where('line_manager_user_id', $user->id)
            ->count();

        $managedAsApprovingManager = EmployeeProfile::query()
            ->where('approving_manager_user_id', $user->id)
            ->count();

        $appraisalsAsManager = Appraisal::withTrashed()
            ->where(function ($query) use ($user) {
                $query->where('line_manager_user_id', $user->id)
                    ->orWhere('approving_manager_user_id', $user->id)
                    ->orWhere('calibrated_by_user_id', $user->id);
            })
            ->whereNotIn('id', $appraisalIds)
            ->count();

        $items = [
            [
                'key' => 'user_account',
                'label' => 'User account',
                'count' => 1,
                'description' => 'Login credentials, approval status, and profile settings.',
            ],
            [
                'key' => 'employee_profile',
                'label' => 'Employee profile',
                'count' => $profileId ? 1 : 0,
                'description' => 'HR record, department, job title, and manager assignments.',
            ],
            [
                'key' => 'appraisals',
                'label' => 'Performance appraisals',
                'count' => $appraisalIds->count(),
                'description' => 'Review cycles, scores, workflow state, and archived copies.',
            ],
            [
                'key' => 'objectives',
                'label' => 'Appraisal objectives & ratings',
                'count' => AppraisalObjective::query()->whereIn('appraisal_id', $appraisalIds)->count()
                    + AppraisalCompetencyRating::query()->whereIn('appraisal_id', $appraisalIds)->count(),
                'description' => 'Goals, KPIs, competency ratings, and manager or self-assessment entries.',
            ],
            [
                'key' => 'workflow',
                'label' => 'Comments, approvals & status history',
                'count' => AppraisalComment::query()->whereIn('appraisal_id', $appraisalIds)->count()
                    + AppraisalApproval::query()->whereIn('appraisal_id', $appraisalIds)->count()
                    + AppraisalStatusHistory::query()->whereIn('appraisal_id', $appraisalIds)->count()
                    + AppraisalComment::query()->where('author_user_id', $user->id)->whereNotIn('appraisal_id', $appraisalIds)->count()
                    + AppraisalApproval::query()->where('actor_user_id', $user->id)->whereNotIn('appraisal_id', $appraisalIds)->count(),
                'description' => 'Discussion threads, approval decisions, and audit-style status transitions.',
            ],
            [
                'key' => 'development',
                'label' => 'Development plans',
                'count' => DevelopmentPlan::query()->whereIn('appraisal_id', $appraisalIds)->count()
                    + DevelopmentPlanAction::query()->whereIn(
                        'development_plan_id',
                        DevelopmentPlan::query()->whereIn('appraisal_id', $appraisalIds)->select('id'),
                    )->count(),
                'description' => 'Post-review development actions and follow-up tasks.',
            ],
            [
                'key' => 'calibration',
                'label' => 'Calibration records',
                'count' => AppraisalCalibration::query()->whereIn('appraisal_id', $appraisalIds)->count()
                    + AppraisalCalibration::query()->where('actor_user_id', $user->id)->whereNotIn('appraisal_id', $appraisalIds)->count(),
                'description' => 'Calibration decisions and supporting evidence metadata.',
            ],
            [
                'key' => 'evidence_files',
                'label' => 'Uploaded evidence files',
                'count' => $evidenceFiles,
                'description' => 'Objective and calibration attachments stored on disk.',
            ],
            [
                'key' => 'access',
                'label' => 'Roles & direct permissions',
                'count' => $user->roles()->count() + $user->permissions()->count(),
                'description' => 'Spatie role and permission assignments for this account.',
            ],
            [
                'key' => 'audit_trails',
                'label' => 'Audit trail references',
                'count' => AuditTrail::query()
                    ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('impersonator_user_id', $user->id))
                    ->count(),
                'description' => 'Historical activity log entries will be kept but detached from this user.',
            ],
        ];

        $cleared = [];

        if ($managedAsLineManager > 0) {
            $cleared[] = [
                'label' => 'Line manager references',
                'count' => $managedAsLineManager,
                'description' => 'Other employee profiles will no longer list this user as line manager.',
            ];
        }

        if ($managedAsApprovingManager > 0) {
            $cleared[] = [
                'label' => 'Approving manager references',
                'count' => $managedAsApprovingManager,
                'description' => 'Other employee profiles will no longer list this user as approving manager.',
            ];
        }

        if ($appraisalsAsManager > 0) {
            $cleared[] = [
                'label' => 'Manager links on appraisals',
                'count' => $appraisalsAsManager,
                'description' => 'Existing appraisals will remain but lose this user as manager or calibrator.',
            ];
        }

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'employee_number' => $user->employeeProfile?->employee_number,
            ],
            'items' => array_values(array_filter($items, fn (array $item) => $item['count'] > 0 || in_array($item['key'], ['user_account', 'employee_profile'], true))),
            'cleared' => $cleared,
            'totals' => [
                'records' => collect($items)->sum('count'),
            ],
        ];
    }

    public function delete(User $user, User $actor): void
    {
        if ($actor->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot delete your own account.'],
            ]);
        }

        $profileId = EmployeeProfile::withTrashed()
            ->where('user_id', $user->id)
            ->value('id');

        $appraisalIds = $this->employeeAppraisalIds($user, $profileId);

        DB::transaction(function () use ($user, $appraisalIds) {
            $this->deleteEvidenceFiles($appraisalIds, $user);

            $user->syncRoles([]);
            $user->syncPermissions([]);

            $user->delete();
        });
    }

    /**
     * @return Collection<int, int>
     */
    private function employeeAppraisalIds(User $user, ?int $profileId)
    {
        return Appraisal::withTrashed()
            ->when(
                $profileId,
                fn ($query) => $query->where(
                    fn ($inner) => $inner
                        ->where('employee_user_id', $user->id)
                        ->orWhere('employee_profile_id', $profileId),
                ),
                fn ($query) => $query->where('employee_user_id', $user->id),
            )
            ->pluck('id');
    }

    /**
     * @param  Collection<int, int>  $appraisalIds
     */
    private function countEvidenceFiles($appraisalIds): int
    {
        return AppraisalObjectiveEvidence::query()
            ->where('evidence_type', 'file')
            ->whereNotNull('path')
            ->whereIn(
                'appraisal_objective_id',
                AppraisalObjective::query()->whereIn('appraisal_id', $appraisalIds)->select('id'),
            )
            ->count();
    }

    /**
     * @param  Collection<int, int>  $appraisalIds
     */
    private function deleteEvidenceFiles($appraisalIds, User $user): void
    {
        AppraisalObjectiveEvidence::query()
            ->where('evidence_type', 'file')
            ->whereNotNull('disk')
            ->whereNotNull('path')
            ->whereIn(
                'appraisal_objective_id',
                AppraisalObjective::query()->whereIn('appraisal_id', $appraisalIds)->select('id'),
            )
            ->get()
            ->each(function (AppraisalObjectiveEvidence $evidence) {
                Storage::disk($evidence->disk)->delete($evidence->path);
            });

        AppraisalCalibrationEvidence::query()
            ->where('uploaded_by_user_id', $user->id)
            ->where('evidence_type', 'file')
            ->whereNotNull('disk')
            ->whereNotNull('path')
            ->get()
            ->each(function (AppraisalCalibrationEvidence $evidence) {
                Storage::disk($evidence->disk)->delete($evidence->path);
            });
    }
}
