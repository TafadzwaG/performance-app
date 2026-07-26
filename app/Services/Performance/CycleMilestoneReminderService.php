<?php

namespace App\Services\Performance;

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Enums\WorkflowStage;
use App\Models\Appraisal;
use App\Models\AppraisalMilestoneReminder;
use App\Models\Organization;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Notifications\Performance\CycleMilestoneReminderNotification;
use App\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Carbon;
use Spatie\Permission\PermissionRegistrar;

class CycleMilestoneReminderService
{
    /** @var list<int> */
    public const REMINDER_DAYS = [7, 3, 1];

    public function __construct(
        private readonly AppraisalNavigationService $navigationService,
    ) {}

    public function sendDueReminders(?Carbon $onDate = null): int
    {
        $context = app(TenantContext::class);

        if ($context->id() !== null) {
            return $this->sendForCurrentOrganization($onDate ?? now($context->organization()?->timezone)->startOfDay());
        }

        $sent = 0;

        Organization::query()->where('status', 'active')->each(function (Organization $organization) use (&$sent, $onDate, $context): void {
            $context->set($organization);
            app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

            $locations = $organization->locations()->where('is_active', true)->get();
            if ($locations->isEmpty()) {
                $sent += $this->sendForCurrentOrganization($onDate ?? now($organization->timezone)->startOfDay());
            } else {
                foreach ($locations as $location) {
                    $timezone = $location->timezone ?: $organization->timezone;
                    $sent += $this->sendForCurrentOrganization(
                        $onDate ?? now($timezone)->startOfDay(),
                        $location->id,
                    );
                }
            }

            $context->clear();
            app(PermissionRegistrar::class)->setPermissionsTeamId(null);
        });

        return $sent;
    }

    private function sendForCurrentOrganization(Carbon $onDate, ?int $locationId = null): int
    {
        $sent = 0;

        foreach (self::REMINDER_DAYS as $daysBefore) {
            $sent += $this->sendRemindersForLeadTime($daysBefore, $onDate, $locationId);
        }

        return $sent;
    }

    private function sendRemindersForLeadTime(int $daysBefore, Carbon $onDate, ?int $locationId = null): int
    {
        $targetDeadline = $onDate->copy()->addDays($daysBefore);
        $sent = 0;

        foreach ($this->milestones() as $milestoneKey => $milestone) {
            ReviewCycle::query()
                ->where('status', ReviewCycleStatus::Open)
                ->whereDate($milestone['deadline_column'], $targetDeadline->toDateString())
                ->with(['appraisals' => function ($query) use ($milestone, $locationId) {
                    $milestone['scopeAppraisals']($query);
                    $query->when($locationId, fn ($appraisals) => $appraisals->whereHas(
                        'employeeProfile',
                        fn ($profiles) => $profiles->withoutGlobalScope('location_visibility')->where('location_id', $locationId),
                    ));
                    $query->with(['employee', 'lineManager', 'approvingManager', 'reviewCycle']);
                }])
                ->each(function (ReviewCycle $cycle) use ($milestoneKey, $milestone, $daysBefore, &$sent) {
                    foreach ($cycle->appraisals as $appraisal) {
                        if ($this->reminderAlreadySent($appraisal, $milestoneKey, $daysBefore)) {
                            continue;
                        }

                        $recipient = $this->resolveRecipient($appraisal, $milestone['recipient']);

                        if (! $recipient instanceof User) {
                            continue;
                        }

                        $deadline = $appraisal->reviewCycle?->{$milestone['deadline_column']};

                        if (! $deadline) {
                            continue;
                        }

                        $recipient->notify(new CycleMilestoneReminderNotification(
                            appraisal: $appraisal,
                            milestoneKey: $milestoneKey,
                            milestoneLabel: $milestone['label'],
                            deadline: $deadline,
                            daysRemaining: $daysBefore,
                            actionUrl: $this->navigationService->routeForWorkflowStage($appraisal, $milestone['workflow_stage']),
                        ));

                        AppraisalMilestoneReminder::query()->create([
                            'appraisal_id' => $appraisal->id,
                            'milestone' => $milestoneKey,
                            'days_before' => $daysBefore,
                            'sent_at' => now(),
                        ]);

                        $sent++;
                    }
                });
        }

        return $sent;
    }

    /**
     * @return array<string, array{
     *     label: string,
     *     deadline_column: string,
     *     workflow_stage: WorkflowStage,
     *     recipient: string,
     *     scopeAppraisals: callable(Builder|Relation): void,
     * }>
     */
    private function milestones(): array
    {
        return [
            'goal_setting' => [
                'label' => 'Goal setting',
                'deadline_column' => 'goal_setting_deadline',
                'workflow_stage' => WorkflowStage::GoalSetting,
                'recipient' => 'employee',
                'scopeAppraisals' => fn (Builder|Relation $query) => $query->where(function (Builder $builder) {
                    $builder->whereIn('status', [
                        AppraisalStatus::Draft,
                        AppraisalStatus::GoalSetting,
                    ])->orWhere(function (Builder $sentBack) {
                        $sentBack->where('status', AppraisalStatus::SentBack)
                            ->where('reopened_stage', WorkflowStage::GoalSetting);
                    });
                }),
            ],
            'self_assessment' => [
                'label' => 'Self-assessment',
                'deadline_column' => 'self_assessment_deadline',
                'workflow_stage' => WorkflowStage::SelfAssessment,
                'recipient' => 'employee',
                'scopeAppraisals' => fn (Builder|Relation $query) => $query->where(function (Builder $builder) {
                    $builder->where('status', AppraisalStatus::SelfAssessmentPending)
                        ->orWhere(function (Builder $sentBack) {
                            $sentBack->where('status', AppraisalStatus::SentBack)
                                ->where('reopened_stage', WorkflowStage::SelfAssessment);
                        });
                }),
            ],
            'manager_review' => [
                'label' => 'Manager review',
                'deadline_column' => 'manager_review_deadline',
                'workflow_stage' => WorkflowStage::ManagerReview,
                'recipient' => 'line_manager',
                'scopeAppraisals' => fn (Builder|Relation $query) => $query->where('status', AppraisalStatus::ManagerReviewPending),
            ],
            'approval' => [
                'label' => 'Approval',
                'deadline_column' => 'approval_deadline',
                'workflow_stage' => WorkflowStage::Approval,
                'recipient' => 'approving_manager',
                'scopeAppraisals' => fn (Builder|Relation $query) => $query->where('status', AppraisalStatus::ApprovalPending),
            ],
        ];
    }

    private function reminderAlreadySent(Appraisal $appraisal, string $milestoneKey, int $daysBefore): bool
    {
        return AppraisalMilestoneReminder::query()
            ->where('appraisal_id', $appraisal->id)
            ->where('milestone', $milestoneKey)
            ->where('days_before', $daysBefore)
            ->exists();
    }

    private function resolveRecipient(Appraisal $appraisal, string $recipientKey): ?User
    {
        return match ($recipientKey) {
            'employee' => $appraisal->employee,
            'line_manager' => $appraisal->lineManager,
            'approving_manager' => $appraisal->approvingManager,
            default => null,
        };
    }
}
