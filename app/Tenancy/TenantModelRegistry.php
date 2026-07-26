<?php

namespace App\Tenancy;

use App\Models\Appraisal;
use App\Models\AppraisalApproval;
use App\Models\AppraisalCalibration;
use App\Models\AppraisalCalibrationEvidence;
use App\Models\AppraisalComment;
use App\Models\AppraisalCompetencyRating;
use App\Models\AppraisalMilestoneReminder;
use App\Models\AppraisalObjective;
use App\Models\AppraisalObjectiveEvidence;
use App\Models\AppraisalStatusHistory;
use App\Models\AppraisalTemplate;
use App\Models\AppraisalTemplateItem;
use App\Models\AuditTrail;
use App\Models\Competency;
use App\Models\Department;
use App\Models\DevelopmentPlan;
use App\Models\DevelopmentPlanAction;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\IssueReport;
use App\Models\IssueStatusHistory;
use App\Models\JobTitle;
use App\Models\Organization;
use App\Models\Perspective;
use App\Models\ReviewCycle;
use App\Models\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class TenantModelRegistry
{
    /** @var list<class-string<Model>> */
    private const MODELS = [
        Department::class,
        JobTitle::class,
        EmployeeProfile::class,
        Role::class,
        ReviewCycle::class,
        Perspective::class,
        Competency::class,
        AppraisalTemplate::class,
        AppraisalTemplateItem::class,
        GoalLibraryItem::class,
        Appraisal::class,
        AppraisalObjective::class,
        AppraisalObjectiveEvidence::class,
        AppraisalCompetencyRating::class,
        AppraisalComment::class,
        AppraisalApproval::class,
        AppraisalStatusHistory::class,
        DevelopmentPlan::class,
        DevelopmentPlanAction::class,
        AppraisalCalibration::class,
        AppraisalCalibrationEvidence::class,
        IssueReport::class,
        IssueStatusHistory::class,
        AppraisalMilestoneReminder::class,
        AuditTrail::class,
    ];

    public function boot(): void
    {
        foreach (self::MODELS as $modelClass) {
            $modelClass::addGlobalScope('organization', function (Builder $builder): void {
                $organizationId = app(TenantContext::class)->id();

                if (
                    $organizationId === null
                    && app()->environment(['local', 'testing'])
                    && Schema::hasTable('organizations')
                ) {
                    $organizationId = Organization::query()->value('id');
                }

                if ($organizationId !== null) {
                    $builder->where($builder->qualifyColumn('organization_id'), $organizationId);
                } else {
                    // Tenant-owned models must fail closed in production when a
                    // job, command, or request forgot to restore tenant context.
                    $builder->whereRaw('1 = 0');
                }
            });

            $modelClass::creating(function (Model $model): void {
                if ($model->getAttribute('organization_id')) {
                    return;
                }

                $organizationId = app(TenantContext::class)->id();

                if ($organizationId !== null) {
                    $model->setAttribute('organization_id', $organizationId);
                } elseif (! app()->environment(['local', 'testing'])) {
                    throw new \LogicException('Cannot create tenant-owned data without an active organization.');
                }
            });
        }

        EmployeeProfile::addGlobalScope('location_visibility', function (Builder $builder): void {
            $user = Auth::user();
            $context = app(TenantContext::class);

            if (! $user || ! $context->id() || ($locationIds = $context->allowedLocationIds($user)) === null) {
                return;
            }

            $builder->where(function (Builder $query) use ($user, $locationIds): void {
                $query->where('user_id', $user->id)->orWhereIn('location_id', $locationIds);
            });
        });

        Appraisal::addGlobalScope('location_visibility', function (Builder $builder): void {
            $user = Auth::user();
            $context = app(TenantContext::class);

            if (! $user || ! $context->id() || ($locationIds = $context->allowedLocationIds($user)) === null) {
                return;
            }

            $builder->where(function (Builder $query) use ($user, $locationIds): void {
                $query->where('employee_user_id', $user->id)
                    ->orWhere('line_manager_user_id', $user->id)
                    ->orWhere('approving_manager_user_id', $user->id)
                    ->orWhereHas('employeeProfile', fn (Builder $profile) => $profile->withoutGlobalScope('location_visibility')->whereIn('location_id', $locationIds));
            });
        });

        IssueReport::addGlobalScope('location_visibility', function (Builder $builder): void {
            $user = Auth::user();
            $context = app(TenantContext::class);

            if (! $user || ! $context->id() || ($locationIds = $context->allowedLocationIds($user)) === null) {
                return;
            }

            $builder->where(function (Builder $query) use ($user, $locationIds): void {
                $query->where('reporter_user_id', $user->id)
                    ->orWhere('assignee_user_id', $user->id)
                    ->orWhereHas('reporter.employeeProfile', fn (Builder $profile) => $profile->withoutGlobalScope('location_visibility')->whereIn('location_id', $locationIds));
            });
        });
    }
}
