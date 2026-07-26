<?php

namespace Database\Seeders;

use App\Enums\AppraisalStatus;
use App\Enums\ApprovalAction;
use App\Enums\ApprovalStage;
use App\Enums\CommentType;
use App\Enums\DevelopmentActionStatus;
use App\Enums\EmploymentStatus;
use App\Enums\EvidenceType;
use App\Enums\ReviewCycleStatus;
use App\Enums\WorkflowStage;
use App\Models\Appraisal;
use App\Models\AppraisalApproval;
use App\Models\AppraisalComment;
use App\Models\AppraisalCompetencyRating;
use App\Models\AppraisalObjective;
use App\Models\AppraisalObjectiveEvidence;
use App\Models\AppraisalStatusHistory;
use App\Models\AppraisalTemplate;
use App\Models\Competency;
use App\Models\Department;
use App\Models\DevelopmentPlan;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Perspective;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\AppraisalScoringService;
use App\Services\Performance\AppraisalTemplateInstantiationService;
use App\Tenancy\TenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PerformanceTestingSeeder extends Seeder
{
    public function run(
        AppraisalTemplateInstantiationService $instantiator,
        AppraisalScoringService $scoringService,
    ): void {
        DB::transaction(function () use ($instantiator, $scoringService) {
            $departments = $this->seedDepartments();
            $jobTitles = $this->seedJobTitles();
            $users = $this->seedUsers();
            $profiles = $this->seedEmployeeProfiles($users, $departments, $jobTitles);
            $cycles = $this->seedReviewCycles();
            $goalLibrary = $this->seedGoalLibraryItems($departments, $jobTitles);

            $template = AppraisalTemplate::query()
                ->with([
                    'objectiveRatingScale.levels',
                    'competencyRatingScale.levels',
                    'overallRatingScale.levels',
                    'items',
                ])
                ->where('code', 'monomotapa-performance-appraisal')
                ->where('version', 1)
                ->firstOrFail();

            foreach ($this->currentCycleScenarios() as $scenario) {
                $this->seedAppraisalScenario(
                    cycle: $cycles[$scenario['cycle']],
                    profile: $profiles[$scenario['profile']],
                    template: $template,
                    instantiator: $instantiator,
                    scoringService: $scoringService,
                    goalLibrary: $goalLibrary,
                    objectiveBlueprints: $scenario['objectives'],
                    competencyBlueprints: $scenario['competencies'],
                    finalState: $scenario['final_state'],
                    developmentPlan: $scenario['development_plan'] ?? null,
                    sendBackNote: $scenario['send_back_note'] ?? null,
                );
            }

            foreach ($this->historicalScenarios() as $scenario) {
                $this->seedAppraisalScenario(
                    cycle: $cycles['fy2025'],
                    profile: $profiles[$scenario['profile']],
                    template: $template,
                    instantiator: $instantiator,
                    scoringService: $scoringService,
                    goalLibrary: $goalLibrary,
                    objectiveBlueprints: $scenario['objectives'],
                    competencyBlueprints: $scenario['competencies'],
                    finalState: AppraisalStatus::Finalized,
                    developmentPlan: $scenario['development_plan'],
                );
            }
        });
    }

    private function seedDepartments(): array
    {
        $departments = [];

        foreach ($this->departmentSeedData() as $code => $data) {
            $departments[$code] = $this->restoreOrCreate(Department::class, ['code' => $code], $data + ['is_active' => true]);
        }

        return $departments;
    }

    private function seedJobTitles(): array
    {
        $jobTitles = [];

        foreach ($this->jobTitleSeedData() as $code => $name) {
            $jobTitles[$code] = $this->restoreOrCreate(JobTitle::class, ['code' => $code], [
                'name' => $name,
                'description' => "{$name} role used for testing the performance appraisal workflow.",
                'is_active' => true,
            ]);
        }

        return $jobTitles;
    }

    private function seedUsers(): array
    {
        $users = [];

        foreach ($this->userSeedData() as $key => $record) {
            $user = User::query()->firstOrNew(['email' => $record['email']]);
            $user->forceFill([
                'name' => $record['name'],
                'password' => 'password',
                'email_verified_at' => now(),
            ])->save();

            $user->memberships()->updateOrCreate(
                ['organization_id' => app(TenantContext::class)->requireId()],
                [
                    'status' => 'active',
                    'is_default' => true,
                    'access_all_locations' => true,
                    'invited_at' => now(),
                    'activated_at' => now(),
                ],
            );

            $user->syncRoles($record['roles']);
            $users[$key] = $user;
        }

        return $users;
    }

    private function seedEmployeeProfiles(array $users, array $departments, array $jobTitles): array
    {
        $profiles = [];
        $locationId = Location::query()->where('is_active', true)->value('id');

        foreach ($this->employeeProfileSeedData() as $key => $data) {
            $profiles[$key] = EmployeeProfile::query()->updateOrCreate(
                ['user_id' => $users[$key]->id],
                [
                    'employee_number' => $data['employee_number'],
                    'national_id' => $data['national_id'],
                    'date_of_birth' => $data['date_of_birth'],
                    'gender' => $data['gender'],
                    'marital_status' => $data['marital_status'],
                    'personal_phone' => $data['personal_phone'],
                    'home_address_line_1' => $data['home_address_line_1'],
                    'home_address_line_2' => $data['home_address_line_2'],
                    'city' => $data['city'],
                    'state_province' => $data['state_province'],
                    'postal_code' => $data['postal_code'],
                    'country' => $data['country'],
                    'emergency_contact_name' => $data['emergency_contact_name'],
                    'emergency_contact_phone' => $data['emergency_contact_phone'],
                    'department_id' => $departments[$data['department']]->id,
                    'location_id' => $locationId,
                    'job_title_id' => $jobTitles[$data['job_title']]->id,
                    'line_manager_user_id' => $data['line_manager'] ? $users[$data['line_manager']]->id : null,
                    'approving_manager_user_id' => $data['approver'] ? $users[$data['approver']]->id : null,
                    'employment_status' => $data['employment_status']->value,
                    'employment_type' => $data['employment_type'],
                    'work_location' => $data['work_location'],
                    'hire_date' => $data['hire_date'],
                    'probation_end_date' => $data['probation_end_date'],
                    'confirmation_date' => $data['confirmation_date'],
                    'is_review_eligible' => $data['is_review_eligible'],
                    'review_eligibility_date' => $data['review_eligibility_date'],
                    'notes' => $data['notes'],
                    'is_active' => $data['is_active'],
                ],
            );
        }

        return $profiles;
    }

    private function seedReviewCycles(): array
    {
        return [
            'fy2025' => ReviewCycle::query()->updateOrCreate(
                ['code' => 'FY2025-ANNUAL'],
                [
                    'name' => '2025 Annual Performance Review',
                    'description' => 'Closed annual cycle used for finalized appraisal history and reporting demos.',
                    'start_date' => '2025-01-01',
                    'end_date' => '2025-12-31',
                    'goal_setting_deadline' => '2025-02-15',
                    'self_assessment_deadline' => '2025-08-31',
                    'manager_review_deadline' => '2025-09-30',
                    'approval_deadline' => '2025-10-15',
                    'status' => ReviewCycleStatus::Closed->value,
                    'opened_at' => '2025-01-03 08:00:00',
                    'closed_at' => '2025-11-15 17:30:00',
                ],
            ),
            'fy2026' => ReviewCycle::query()->updateOrCreate(
                ['code' => 'FY2026-ANNUAL'],
                [
                    'name' => '2026 Annual Performance Review',
                    'description' => 'Current live cycle with appraisals in multiple workflow states.',
                    'start_date' => '2026-01-01',
                    'end_date' => '2026-12-31',
                    'goal_setting_deadline' => '2026-02-15',
                    'self_assessment_deadline' => '2026-08-31',
                    'manager_review_deadline' => '2026-09-30',
                    'approval_deadline' => '2026-10-15',
                    'status' => ReviewCycleStatus::Open->value,
                    'opened_at' => '2026-01-05 08:00:00',
                    'closed_at' => null,
                ],
            ),
            'midyear_2026' => ReviewCycle::query()->updateOrCreate(
                ['code' => 'MID2026-PULSE'],
                [
                    'name' => '2026 Mid-Year Pulse Review',
                    'description' => 'Draft cycle used for testing future assignments and draft appraisals.',
                    'start_date' => '2026-07-01',
                    'end_date' => '2026-12-31',
                    'goal_setting_deadline' => '2026-07-31',
                    'self_assessment_deadline' => '2026-09-30',
                    'manager_review_deadline' => '2026-10-15',
                    'approval_deadline' => '2026-10-31',
                    'status' => ReviewCycleStatus::Draft->value,
                    'opened_at' => null,
                    'closed_at' => null,
                ],
            ),
        ];
    }

    private function seedGoalLibraryItems(array $departments, array $jobTitles): array
    {
        $perspectives = Perspective::query()->get()->keyBy('code');
        $items = [];

        foreach ($this->goalLibrarySeedData() as $title => $record) {
            $items[$title] = GoalLibraryItem::query()->updateOrCreate(
                [
                    'title' => $title,
                    'department_id' => $departments[$record['department']]->id,
                    'job_title_id' => $jobTitles[$record['job_title']]->id,
                ],
                [
                    'perspective_id' => $perspectives[$record['perspective']]->id,
                    'description' => $record['description'],
                    'kpi_measure' => $record['kpi_measure'],
                    'target_definition' => $record['target_definition'],
                    'default_weight' => $record['default_weight'],
                    'evidence_source' => $record['evidence_source'],
                    'timeline_days' => $record['timeline_days'],
                    'is_active' => true,
                ],
            );
        }

        return $items;
    }

    private function seedAppraisalScenario(
        ReviewCycle $cycle,
        EmployeeProfile $profile,
        AppraisalTemplate $template,
        AppraisalTemplateInstantiationService $instantiator,
        AppraisalScoringService $scoringService,
        array $goalLibrary,
        array $objectiveBlueprints,
        array $competencyBlueprints,
        AppraisalStatus $finalState,
        ?array $developmentPlan = null,
        ?string $sendBackNote = null,
    ): void {
        $profile->loadMissing(['user', 'department', 'jobTitle', 'lineManager', 'approvingManager']);

        $appraisal = Appraisal::query()->updateOrCreate(
            [
                'review_cycle_id' => $cycle->id,
                'employee_profile_id' => $profile->id,
            ],
            [
                'template_id' => $template->id,
                'employee_user_id' => $profile->user_id,
                'line_manager_user_id' => $profile->line_manager_user_id,
                'approving_manager_user_id' => $profile->approving_manager_user_id,
                'status' => $cycle->status === ReviewCycleStatus::Draft ? AppraisalStatus::Draft->value : AppraisalStatus::GoalSetting->value,
                'reopened_stage' => null,
                'business_weight_percent' => (int) $template->business_weight_percent,
                'values_weight_percent' => (int) $template->values_weight_percent,
                'business_score' => null,
                'values_score' => null,
                'overall_score' => null,
                'overall_rating_scale_level_id' => null,
                'goal_submitted_at' => null,
                'self_assessment_submitted_at' => null,
                'manager_reviewed_at' => null,
                'approved_at' => null,
                'finalized_at' => null,
                'employee_name_snapshot' => $profile->user?->name ?? 'Unknown employee',
                'employee_email_snapshot' => $profile->user?->email ?? 'unknown@nhaka.test',
                'employee_number_snapshot' => $profile->employee_number,
                'department_name_snapshot' => $profile->department?->name,
                'job_title_name_snapshot' => $profile->jobTitle?->name,
                'cycle_name_snapshot' => $cycle->name,
                'template_name_snapshot' => $template->name,
            ],
        );

        $this->resetAppraisalChildren($appraisal);
        $instantiator->createChildren($appraisal);

        $template->loadMissing(['objectiveRatingScale.levels', 'competencyRatingScale.levels', 'overallRatingScale.levels']);

        $objectiveLevels = $template->objectiveRatingScale->levels->keyBy('value');
        $competencyLevels = $template->competencyRatingScale->levels->keyBy('value');

        $populateSelfRatings = in_array($finalState, [
            AppraisalStatus::ManagerReviewPending,
            AppraisalStatus::ApprovalPending,
            AppraisalStatus::Approved,
            AppraisalStatus::SentBack,
            AppraisalStatus::Finalized,
        ], true);

        $populateManagerRatings = in_array($finalState, [
            AppraisalStatus::ApprovalPending,
            AppraisalStatus::Approved,
            AppraisalStatus::SentBack,
            AppraisalStatus::Finalized,
        ], true);

        $this->syncObjectives($appraisal, $objectiveBlueprints, $goalLibrary, $objectiveLevels, $populateSelfRatings, $populateManagerRatings);
        $this->syncCompetencies($appraisal, $competencyBlueprints, $competencyLevels, $populateSelfRatings, $populateManagerRatings);
        $this->applyWorkflowState($appraisal, $scoringService, $finalState, $developmentPlan, $sendBackNote);
    }

    private function syncObjectives(
        Appraisal $appraisal,
        array $objectiveBlueprints,
        array $goalLibrary,
        Collection $levels,
        bool $populateSelfRatings,
        bool $populateManagerRatings,
    ): void {
        $perspectives = Perspective::query()->get()->keyBy('code');
        $objectives = $appraisal->objectives()->orderBy('sort_order')->get()->values();

        foreach ($objectiveBlueprints as $index => $blueprint) {
            $objective = $objectives->get($index) ?? new AppraisalObjective([
                'appraisal_id' => $appraisal->id,
                'sort_order' => $index + 1,
            ]);
            $selfLevel = $populateSelfRatings && isset($blueprint['self_rating']) ? $levels->get($blueprint['self_rating']) : null;
            $managerLevel = $populateManagerRatings && isset($blueprint['manager_rating']) ? $levels->get($blueprint['manager_rating']) : null;

            $objective->fill([
                'perspective_id' => $perspectives[$blueprint['perspective']]->id,
                'goal_library_item_id' => $goalLibrary[$blueprint['title']]->id ?? null,
                'objective_type' => 'business',
                'title' => $blueprint['title'],
                'kpi_measure' => $blueprint['kpi'],
                'target_definition' => $blueprint['target'],
                'weight' => 25,
                'evidence_source' => $blueprint['evidence'],
                'due_date' => $blueprint['due_date'],
                'performance_achieved' => $populateSelfRatings
                    ? "Progress captured against \"{$blueprint['title']}\" with evidence from the operating teams."
                    : null,
                'employee_comment' => $populateSelfRatings
                    ? "I made steady progress on {$blueprint['title']} and tracked outcomes each month."
                    : null,
                'manager_comment' => $populateManagerRatings
                    ? "Manager review: {$blueprint['title']} was assessed against the agreed KPI and target."
                    : null,
                'self_rating_scale_level_id' => $selfLevel?->id,
                'self_rating_score' => $selfLevel?->value,
                'manager_rating_scale_level_id' => $managerLevel?->id,
                'manager_rating_score' => $managerLevel?->value,
                'include_in_business_score' => true,
                'sort_order' => $index + 1,
            ])->save();

            $objective->evidences()->delete();

            if ($populateSelfRatings) {
                AppraisalObjectiveEvidence::query()->create([
                    'appraisal_objective_id' => $objective->id,
                    'uploaded_by_user_id' => $appraisal->employee_user_id,
                    'evidence_type' => EvidenceType::Link->value,
                    'url' => 'https://portal.nhaka.test/evidence/'.$appraisal->employee_number_snapshot.'/'.($index + 1),
                    'notes' => "Supporting evidence for {$blueprint['title']}.",
                ]);
            }
        }
    }

    private function syncCompetencies(
        Appraisal $appraisal,
        array $competencyBlueprints,
        Collection $levels,
        bool $populateSelfRatings,
        bool $populateManagerRatings,
    ): void {
        $ratings = $appraisal->competencyRatings()->with('competency')->orderBy('sort_order')->get()->keyBy('competency.code');

        foreach ($competencyBlueprints as $index => $blueprint) {
            $rating = $ratings->get($blueprint['code']);
            if (! $rating) {
                $competency = Competency::query()->where('code', $blueprint['code'])->firstOrFail();
                $rating = new AppraisalCompetencyRating([
                    'appraisal_id' => $appraisal->id,
                    'competency_id' => $competency->id,
                ]);
            }
            $selfLevel = $populateSelfRatings && isset($blueprint['self_rating']) ? $levels->get($blueprint['self_rating']) : null;
            $managerLevel = $populateManagerRatings && isset($blueprint['manager_rating']) ? $levels->get($blueprint['manager_rating']) : null;

            $rating->fill([
                'self_rating_scale_level_id' => $selfLevel?->id,
                'self_rating_score' => $selfLevel?->value,
                'manager_rating_scale_level_id' => $managerLevel?->id,
                'manager_rating_score' => $managerLevel?->value,
                'employee_comment' => $populateSelfRatings ? ($blueprint['employee_comment'] ?: null) : null,
                'manager_comment' => $populateManagerRatings ? ($blueprint['manager_comment'] ?? null) : null,
                'sort_order' => $index + 1,
            ])->save();
        }
    }

    private function resetAppraisalChildren(Appraisal $appraisal): void
    {
        $appraisal->loadMissing(['developmentPlan.actions', 'objectives.evidences', 'competencyRatings']);

        $appraisal->comments()->delete();
        $appraisal->approvals()->delete();
        $appraisal->statusHistories()->delete();

        if ($appraisal->developmentPlan) {
            $appraisal->developmentPlan->actions()->delete();
            $appraisal->developmentPlan->delete();
        }

        foreach ($appraisal->objectives as $objective) {
            $objective->evidences()->delete();
        }

        $appraisal->objectives()->delete();
        $appraisal->competencyRatings()->delete();
    }

    private function applyWorkflowState(
        Appraisal $appraisal,
        AppraisalScoringService $scoringService,
        AppraisalStatus $finalState,
        ?array $developmentPlan,
        ?string $sendBackNote,
    ): void {
        $appraisal->loadMissing(['employee', 'lineManager', 'approvingManager']);
        $timeline = $this->timelineFor($appraisal->reviewCycle);

        if ($finalState === AppraisalStatus::Draft) {
            $appraisal->forceFill(['status' => AppraisalStatus::Draft->value])->save();
            $this->seedNarrativeComments($appraisal, $finalState, $sendBackNote);

            return;
        }

        if ($finalState === AppraisalStatus::GoalSetting) {
            $appraisal->forceFill(['status' => AppraisalStatus::GoalSetting->value])->save();
            $this->seedNarrativeComments($appraisal, $finalState, $sendBackNote);

            return;
        }

        $this->recordTransition(
            $appraisal,
            $appraisal->employee,
            AppraisalStatus::GoalSetting,
            AppraisalStatus::SelfAssessmentPending,
            ApprovalStage::GoalSetting,
            ApprovalAction::Submitted,
            $timeline['goal'],
            'Goal plan submitted and agreed with the line manager.',
            ['goal_submitted_at' => $timeline['goal'], 'reopened_stage' => null],
        );

        if ($finalState === AppraisalStatus::SelfAssessmentPending) {
            $this->seedNarrativeComments($appraisal, $finalState, $sendBackNote);

            return;
        }

        $this->recordTransition(
            $appraisal,
            $appraisal->employee,
            AppraisalStatus::SelfAssessmentPending,
            AppraisalStatus::ManagerReviewPending,
            ApprovalStage::SelfAssessment,
            ApprovalAction::Submitted,
            $timeline['self'],
            'Self assessment submitted with supporting evidence.',
            ['self_assessment_submitted_at' => $timeline['self'], 'reopened_stage' => null],
        );

        if ($finalState === AppraisalStatus::ManagerReviewPending) {
            $this->seedNarrativeComments($appraisal, $finalState, $sendBackNote);

            return;
        }

        $this->recordTransition(
            $appraisal,
            $appraisal->lineManager,
            AppraisalStatus::ManagerReviewPending,
            AppraisalStatus::ApprovalPending,
            ApprovalStage::ManagerReview,
            ApprovalAction::Forwarded,
            $timeline['manager'],
            'Manager review completed and forwarded for approval.',
            ['manager_reviewed_at' => $timeline['manager'], 'reopened_stage' => null],
        );

        if ($finalState === AppraisalStatus::ApprovalPending) {
            $this->seedNarrativeComments($appraisal, $finalState, $sendBackNote);

            return;
        }

        if ($finalState === AppraisalStatus::SentBack) {
            $this->recordTransition(
                $appraisal,
                $appraisal->approvingManager,
                AppraisalStatus::ApprovalPending,
                AppraisalStatus::SentBack,
                ApprovalStage::Approval,
                ApprovalAction::Rejected,
                $timeline['approval'],
                $sendBackNote ?? 'Please strengthen the evidence and resubmit.',
                ['reopened_stage' => WorkflowStage::SelfAssessment->value],
                CommentType::SendBack,
            );

            $this->seedNarrativeComments($appraisal, $finalState, $sendBackNote);

            return;
        }

        $scores = $scoringService->calculate($appraisal->fresh());

        $this->recordTransition(
            $appraisal,
            $appraisal->approvingManager,
            AppraisalStatus::ApprovalPending,
            AppraisalStatus::Approved,
            ApprovalStage::Approval,
            ApprovalAction::Approved,
            $timeline['approval'],
            'Approved after reviewing the manager ratings and supporting evidence.',
            [
                'business_score' => $scores['business_score'],
                'values_score' => $scores['values_score'],
                'overall_score' => $scores['overall_score'],
                'overall_rating_scale_level_id' => $scores['overall_level']?->id,
                'approved_at' => $timeline['approval'],
                'reopened_stage' => null,
            ],
        );

        if ($developmentPlan) {
            $this->seedDevelopmentPlan($appraisal, $developmentPlan);
        }

        if ($finalState === AppraisalStatus::Approved) {
            $this->seedNarrativeComments($appraisal, $finalState, $sendBackNote);

            return;
        }

        $this->recordTransition(
            $appraisal,
            User::query()->where('email', 'tariro.chigumira@nhaka.test')->firstOrFail(),
            AppraisalStatus::Approved,
            AppraisalStatus::Finalized,
            ApprovalStage::Finalization,
            ApprovalAction::Finalized,
            $timeline['finalized'],
            'Finalized by HR after approval and score confirmation.',
            ['finalized_at' => $timeline['finalized']],
        );

        $this->seedNarrativeComments($appraisal, $finalState, $sendBackNote);
    }

    private function recordTransition(
        Appraisal $appraisal,
        User $actor,
        AppraisalStatus $fromStatus,
        AppraisalStatus $toStatus,
        ApprovalStage $stage,
        ApprovalAction $action,
        CarbonImmutable $actedAt,
        ?string $comments = null,
        array $attributes = [],
        ?CommentType $commentType = null,
    ): void {
        $appraisal->forceFill($attributes + ['status' => $toStatus->value])->save();
        $appraisal->load(['objectives', 'competencyRatings', 'overallRatingLevel']);

        AppraisalApproval::query()->create([
            'appraisal_id' => $appraisal->id,
            'actor_user_id' => $actor->id,
            'stage' => $stage->value,
            'action' => $action->value,
            'comments' => $comments,
            'snapshot' => $this->snapshot($appraisal),
            'acted_at' => $actedAt,
        ]);

        AppraisalStatusHistory::query()->create([
            'appraisal_id' => $appraisal->id,
            'actor_user_id' => $actor->id,
            'from_status' => $fromStatus->value,
            'to_status' => $toStatus->value,
            'reason' => $comments,
            'metadata' => $this->snapshot($appraisal),
            'changed_at' => $actedAt,
        ]);

        if ($commentType && $comments) {
            AppraisalComment::query()->create([
                'appraisal_id' => $appraisal->id,
                'author_user_id' => $actor->id,
                'comment_type' => $commentType->value,
                'body' => $comments,
                'created_at' => $actedAt,
                'updated_at' => $actedAt,
            ]);
        }
    }

    private function seedNarrativeComments(Appraisal $appraisal, AppraisalStatus $status, ?string $sendBackNote): void
    {
        $employeeAt = now()->subDays(12);
        $managerAt = now()->subDays(8);
        $approverAt = now()->subDays(4);

        if (in_array($status, [
            AppraisalStatus::ManagerReviewPending,
            AppraisalStatus::ApprovalPending,
            AppraisalStatus::Approved,
            AppraisalStatus::SentBack,
            AppraisalStatus::Finalized,
        ], true)) {
            AppraisalComment::query()->create([
                'appraisal_id' => $appraisal->id,
                'author_user_id' => $appraisal->employee_user_id,
                'comment_type' => CommentType::AchievementNote->value,
                'body' => 'Key achievements were supported by branch, service desk, and operating reports throughout the cycle.',
                'created_at' => $employeeAt,
                'updated_at' => $employeeAt,
            ]);

            AppraisalComment::query()->create([
                'appraisal_id' => $appraisal->id,
                'author_user_id' => $appraisal->employee_user_id,
                'comment_type' => CommentType::SignificantIssue->value,
                'body' => 'A few peak-period workloads affected turnaround times, but these were tracked and escalated promptly.',
                'created_at' => $employeeAt->addHour(),
                'updated_at' => $employeeAt->addHour(),
            ]);
        }

        if (in_array($status, [
            AppraisalStatus::ApprovalPending,
            AppraisalStatus::Approved,
            AppraisalStatus::SentBack,
            AppraisalStatus::Finalized,
        ], true)) {
            AppraisalComment::query()->create([
                'appraisal_id' => $appraisal->id,
                'author_user_id' => $appraisal->line_manager_user_id,
                'comment_type' => CommentType::General->value,
                'body' => 'Manager review completed against agreed KPIs, supporting evidence, and observable behaviours.',
                'created_at' => $managerAt,
                'updated_at' => $managerAt,
            ]);
        }

        if (in_array($status, [AppraisalStatus::Approved, AppraisalStatus::Finalized], true)) {
            AppraisalComment::query()->create([
                'appraisal_id' => $appraisal->id,
                'author_user_id' => $appraisal->approving_manager_user_id,
                'comment_type' => CommentType::General->value,
                'body' => 'Approving manager confirmed the appraisal outcome and final score with no outstanding concerns.',
                'created_at' => $approverAt,
                'updated_at' => $approverAt,
            ]);
        }

        if ($status === AppraisalStatus::SentBack && $sendBackNote) {
            AppraisalComment::query()->firstOrCreate([
                'appraisal_id' => $appraisal->id,
                'author_user_id' => $appraisal->approving_manager_user_id,
                'comment_type' => CommentType::SendBack->value,
                'body' => $sendBackNote,
            ]);
        }
    }

    private function seedDevelopmentPlan(Appraisal $appraisal, array $data): void
    {
        $plan = DevelopmentPlan::query()->updateOrCreate(
            ['appraisal_id' => $appraisal->id],
            [
                'strengths' => $data['strengths'],
                'improvement_areas' => $data['improvement_areas'],
                'follow_up_notes' => $data['follow_up_notes'],
            ],
        );

        $plan->actions()->delete();

        foreach ($data['actions'] as $action) {
            $plan->actions()->create([
                'action' => $action['action'],
                'owner_user_id' => User::query()->where('email', str_replace('_', '.', $action['owner']).'@nhaka.test')->value('id'),
                'due_date' => $action['due_date'],
                'status' => $action['status']->value,
                'follow_up_status' => $action['follow_up_status'],
                'completed_at' => $action['status'] === DevelopmentActionStatus::Completed ? $action['due_date'].' 17:00:00' : null,
            ]);
        }
    }

    private function timelineFor(ReviewCycle $cycle): array
    {
        $start = CarbonImmutable::parse($cycle->start_date);

        return [
            'goal' => $start->addDays(15)->setTime(9, 0),
            'self' => $start->addDays(45)->setTime(14, 30),
            'manager' => $start->addDays(58)->setTime(11, 15),
            'approval' => $start->addDays(66)->setTime(16, 0),
            'finalized' => $start->addDays(72)->setTime(10, 30),
        ];
    }

    private function snapshot(Appraisal $appraisal): array
    {
        return [
            'status' => $appraisal->status?->value ?? $appraisal->getRawOriginal('status'),
            'business_score' => $appraisal->business_score,
            'values_score' => $appraisal->values_score,
            'overall_score' => $appraisal->overall_score,
            'overall_rating' => $appraisal->overallRatingLevel?->label,
            'objectives' => $appraisal->objectives->map(fn ($objective) => [
                'title' => $objective->title,
                'weight' => $objective->weight,
                'self_rating' => $objective->self_rating_score,
                'manager_rating' => $objective->manager_rating_score,
            ])->values()->all(),
            'competencies' => $appraisal->competencyRatings->map(fn ($rating) => [
                'competency_id' => $rating->competency_id,
                'self_rating' => $rating->self_rating_score,
                'manager_rating' => $rating->manager_rating_score,
            ])->values()->all(),
        ];
    }

    private function departmentSeedData(): array
    {
        return [
            'FIN' => ['name' => 'Finance', 'description' => 'Financial planning, controls, and reporting.'],
            'HC' => ['name' => 'Human Capital', 'description' => 'People operations, talent, and culture.'],
            'OPS' => ['name' => 'Operations', 'description' => 'Branch operations, service execution, and controls.'],
            'DIG' => ['name' => 'Digital Services', 'description' => 'Platforms, engineering, and digital support.'],
            'CX' => ['name' => 'Customer Experience', 'description' => 'Customer care and service improvement.'],
            'CMB' => ['name' => 'Commercial Banking', 'description' => 'Relationship banking and SME growth.'],
        ];
    }

    private function jobTitleSeedData(): array
    {
        return [
            'HRBP' => 'Human Resources Business Partner',
            'ROM' => 'Retail Operations Manager',
            'HOO' => 'Head of Operations',
            'DSM' => 'Digital Services Manager',
            'COO' => 'Chief Operations Officer',
            'FM' => 'Finance Manager',
            'HOF' => 'Head of Finance',
            'FINO' => 'Finance Officer',
            'SA' => 'Systems Analyst',
            'RM' => 'Relationship Manager',
            'CXO' => 'Customer Experience Officer',
            'OPA' => 'Operations Analyst',
            'PSO' => 'Product Support Officer',
        ];
    }

    private function userSeedData(): array
    {
        return [
            'rutendo_moyo' => ['name' => 'Rutendo Moyo', 'email' => 'rutendo.moyo@nhaka.test', 'roles' => ['Super Admin']],
            'tariro_chigumira' => ['name' => 'Tariro Chigumira', 'email' => 'tariro.chigumira@nhaka.test', 'roles' => ['HR Admin']],
            'tawanda_ndlovu' => ['name' => 'Tawanda Ndlovu', 'email' => 'tawanda.ndlovu@nhaka.test', 'roles' => ['Manager']],
            'nyasha_sibanda' => ['name' => 'Nyasha Sibanda', 'email' => 'nyasha.sibanda@nhaka.test', 'roles' => ['Approving Manager']],
            'vimbai_mlambo' => ['name' => 'Vimbai Mlambo', 'email' => 'vimbai.mlambo@nhaka.test', 'roles' => ['Manager']],
            'kudzai_chirwa' => ['name' => 'Kudzai Chirwa', 'email' => 'kudzai.chirwa@nhaka.test', 'roles' => ['Approving Manager']],
            'farirai_chihota' => ['name' => 'Farirai Chihota', 'email' => 'farirai.chihota@nhaka.test', 'roles' => ['Manager']],
            'chenai_gondo' => ['name' => 'Chenai Gondo', 'email' => 'chenai.gondo@nhaka.test', 'roles' => ['Approving Manager']],
            'tatenda_dube' => ['name' => 'Tatenda Dube', 'email' => 'tatenda.dube@nhaka.test', 'roles' => ['Employee']],
            'rumbidzai_ncube' => ['name' => 'Rumbidzai Ncube', 'email' => 'rumbidzai.ncube@nhaka.test', 'roles' => ['Employee']],
            'farai_muchengeti' => ['name' => 'Farai Muchengeti', 'email' => 'farai.muchengeti@nhaka.test', 'roles' => ['Employee']],
            'chiedza_nyoni' => ['name' => 'Chiedza Nyoni', 'email' => 'chiedza.nyoni@nhaka.test', 'roles' => ['Employee']],
            'tinashe_bhebhe' => ['name' => 'Tinashe Bhebhe', 'email' => 'tinashe.bhebhe@nhaka.test', 'roles' => ['Employee']],
            'nyari_musindo' => ['name' => 'Nyari Musindo', 'email' => 'nyari.musindo@nhaka.test', 'roles' => ['Employee']],
            'tanaka_chikafa' => ['name' => 'Tanaka Chikafa', 'email' => 'tanaka.chikafa@nhaka.test', 'roles' => ['Employee']],
            'anesu_mudzimu' => ['name' => 'Anesu Mudzimu', 'email' => 'anesu.mudzimu@nhaka.test', 'roles' => ['Employee']],
        ];
    }

    private function goalLibrarySeedData(): array
    {
        return [
            'Reduce unreconciled suspense items' => [
                'department' => 'FIN',
                'job_title' => 'FINO',
                'perspective' => 'internal_process',
                'description' => 'Drive monthly clean-up discipline on finance suspense balances.',
                'kpi_measure' => 'Aged suspense items over 30 days',
                'target_definition' => 'Keep aged suspense items below five.',
                'default_weight' => 25,
                'evidence_source' => 'Reconciliation dashboard',
                'timeline_days' => 180,
            ],
            'Improve first-contact resolution for walk-in customer complaints' => [
                'department' => 'CX',
                'job_title' => 'CXO',
                'perspective' => 'customer',
                'description' => 'Strengthen frontline complaint handling to reduce repeat visits.',
                'kpi_measure' => 'First-contact resolution rate',
                'target_definition' => 'Achieve at least 88% first-contact resolution.',
                'default_weight' => 25,
                'evidence_source' => 'Customer care dashboard',
                'timeline_days' => 270,
            ],
            'Reduce severity-one incident recovery time' => [
                'department' => 'DIG',
                'job_title' => 'SA',
                'perspective' => 'internal_process',
                'description' => 'Improve operational resilience for key banking channels.',
                'kpi_measure' => 'Mean time to recovery',
                'target_definition' => 'Keep severity-one MTTR below 45 minutes.',
                'default_weight' => 25,
                'evidence_source' => 'Monitoring and incident reports',
                'timeline_days' => 240,
            ],
            'Grow the SME lending portfolio in Mutare' => [
                'department' => 'CMB',
                'job_title' => 'RM',
                'perspective' => 'financial',
                'description' => 'Drive quality SME portfolio growth in Manicaland.',
                'kpi_measure' => 'Net portfolio growth',
                'target_definition' => 'Deliver 12% net portfolio growth.',
                'default_weight' => 25,
                'evidence_source' => 'Portfolio growth dashboard',
                'timeline_days' => 300,
            ],
            'Improve branch queue waiting time in Gweru' => [
                'department' => 'OPS',
                'job_title' => 'OPA',
                'perspective' => 'customer',
                'description' => 'Shorten branch queues and smooth peak-period service delivery.',
                'kpi_measure' => 'Average queue waiting time',
                'target_definition' => 'Keep queue time below 9 minutes.',
                'default_weight' => 25,
                'evidence_source' => 'Branch queue dashboard',
                'timeline_days' => 210,
            ],
            'Complete succession planning for critical roles' => [
                'department' => 'HC',
                'job_title' => 'HRBP',
                'perspective' => 'learning_growth',
                'description' => 'Refresh succession readiness for critical business roles.',
                'kpi_measure' => 'Succession slates completed',
                'target_definition' => 'Complete succession slates for all critical roles.',
                'default_weight' => 20,
                'evidence_source' => 'Talent review pack',
                'timeline_days' => 180,
            ],
        ];
    }

    private function employeeProfileSeedData(): array
    {
        return [
            'tariro_chigumira' => [
                'employee_number' => 'HC-001',
                'national_id' => '12-284512-T-14',
                'date_of_birth' => '1988-05-14',
                'gender' => 'female',
                'marital_status' => 'married',
                'personal_phone' => '0772123401',
                'home_address_line_1' => '12 Marlborough Drive',
                'home_address_line_2' => 'Marlborough',
                'city' => 'Harare',
                'state_province' => 'Harare',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Tendai Chigumira',
                'emergency_contact_phone' => '0772123499',
                'department' => 'HC',
                'job_title' => 'HRBP',
                'line_manager' => 'kudzai_chirwa',
                'approver' => 'rutendo_moyo',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Borrowdale, Harare',
                'hire_date' => '2021-01-11',
                'probation_end_date' => '2021-04-11',
                'confirmation_date' => '2021-04-12',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2021-04-12',
                'notes' => 'Leads the annual performance calendar and line manager training.',
                'is_active' => true,
            ],
            'tawanda_ndlovu' => [
                'employee_number' => 'OPS-001',
                'national_id' => '63-174225-N-27',
                'date_of_birth' => '1984-09-18',
                'gender' => 'male',
                'marital_status' => 'married',
                'personal_phone' => '0773111101',
                'home_address_line_1' => '7 Westgate Link',
                'home_address_line_2' => 'Westgate',
                'city' => 'Harare',
                'state_province' => 'Harare',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Tafadzwa Ndlovu',
                'emergency_contact_phone' => '0773111199',
                'department' => 'OPS',
                'job_title' => 'ROM',
                'line_manager' => 'nyasha_sibanda',
                'approver' => 'kudzai_chirwa',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Southerton, Harare',
                'hire_date' => '2019-03-01',
                'probation_end_date' => '2019-06-01',
                'confirmation_date' => '2019-06-03',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2019-06-03',
                'notes' => 'Owns branch operations performance in Harare and Midlands.',
                'is_active' => true,
            ],
            'nyasha_sibanda' => [
                'employee_number' => 'OPS-002',
                'national_id' => '08-642175-S-05',
                'date_of_birth' => '1982-12-05',
                'gender' => 'female',
                'marital_status' => 'married',
                'personal_phone' => '0773112202',
                'home_address_line_1' => '41 Matsheumhlope Road',
                'home_address_line_2' => 'Burnside',
                'city' => 'Bulawayo',
                'state_province' => 'Bulawayo',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Khulekani Sibanda',
                'emergency_contact_phone' => '0773112299',
                'department' => 'OPS',
                'job_title' => 'HOO',
                'line_manager' => 'kudzai_chirwa',
                'approver' => 'rutendo_moyo',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Belmont, Bulawayo',
                'hire_date' => '2017-08-14',
                'probation_end_date' => '2017-11-14',
                'confirmation_date' => '2017-11-15',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2017-11-15',
                'notes' => 'Regional operations approver for branch and service performance reviews.',
                'is_active' => true,
            ],
            'vimbai_mlambo' => [
                'employee_number' => 'DIG-001',
                'national_id' => '10-378126-M-44',
                'date_of_birth' => '1987-02-24',
                'gender' => 'female',
                'marital_status' => 'single',
                'personal_phone' => '0774556601',
                'home_address_line_1' => '3 Greendale Avenue',
                'home_address_line_2' => 'Greendale',
                'city' => 'Harare',
                'state_province' => 'Harare',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Memory Mlambo',
                'emergency_contact_phone' => '0774556699',
                'department' => 'DIG',
                'job_title' => 'DSM',
                'line_manager' => 'kudzai_chirwa',
                'approver' => 'rutendo_moyo',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Newlands, Harare',
                'hire_date' => '2020-04-06',
                'probation_end_date' => '2020-07-06',
                'confirmation_date' => '2020-07-07',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2020-07-07',
                'notes' => 'Leads digital platforms and service reliability.',
                'is_active' => true,
            ],
            'kudzai_chirwa' => [
                'employee_number' => 'EXE-001',
                'national_id' => '25-194387-C-71',
                'date_of_birth' => '1979-11-02',
                'gender' => 'male',
                'marital_status' => 'married',
                'personal_phone' => '0775000001',
                'home_address_line_1' => '18 Borrowdale Brooke Lane',
                'home_address_line_2' => 'Borrowdale Brooke',
                'city' => 'Harare',
                'state_province' => 'Harare',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Rudo Chirwa',
                'emergency_contact_phone' => '0775000099',
                'department' => 'OPS',
                'job_title' => 'COO',
                'line_manager' => 'rutendo_moyo',
                'approver' => null,
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Borrowdale, Harare',
                'hire_date' => '2015-01-05',
                'probation_end_date' => '2015-04-05',
                'confirmation_date' => '2015-04-06',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2015-04-06',
                'notes' => 'Executive approver for critical operations and digital functions.',
                'is_active' => true,
            ],
            'farirai_chihota' => [
                'employee_number' => 'FIN-001',
                'national_id' => '29-254871-C-13',
                'date_of_birth' => '1985-07-07',
                'gender' => 'male',
                'marital_status' => 'married',
                'personal_phone' => '0776224401',
                'home_address_line_1' => '9 Hillside Road',
                'home_address_line_2' => 'Hillside',
                'city' => 'Bulawayo',
                'state_province' => 'Bulawayo',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Mufaro Chihota',
                'emergency_contact_phone' => '0776224499',
                'department' => 'FIN',
                'job_title' => 'FM',
                'line_manager' => 'chenai_gondo',
                'approver' => 'rutendo_moyo',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Belmont, Bulawayo',
                'hire_date' => '2018-06-18',
                'probation_end_date' => '2018-09-18',
                'confirmation_date' => '2018-09-19',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2018-09-19',
                'notes' => 'Owns accounting operations and the monthly close rhythm.',
                'is_active' => true,
            ],
            'chenai_gondo' => [
                'employee_number' => 'FIN-002',
                'national_id' => '58-908311-G-24',
                'date_of_birth' => '1981-04-09',
                'gender' => 'female',
                'marital_status' => 'married',
                'personal_phone' => '0776225502',
                'home_address_line_1' => '20 Suburbs Crescent',
                'home_address_line_2' => 'Suburbs',
                'city' => 'Bulawayo',
                'state_province' => 'Bulawayo',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Charles Gondo',
                'emergency_contact_phone' => '0776225599',
                'department' => 'FIN',
                'job_title' => 'HOF',
                'line_manager' => 'rutendo_moyo',
                'approver' => null,
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Belmont, Bulawayo',
                'hire_date' => '2016-02-01',
                'probation_end_date' => '2016-05-01',
                'confirmation_date' => '2016-05-02',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2016-05-02',
                'notes' => 'Approving manager for finance appraisals and year-end calibration.',
                'is_active' => true,
            ],
            'tatenda_dube' => [
                'employee_number' => 'CX-001',
                'national_id' => '14-771245-D-61',
                'date_of_birth' => '1994-03-12',
                'gender' => 'female',
                'marital_status' => 'married',
                'personal_phone' => '0778011201',
                'home_address_line_1' => '27 Avondale West',
                'home_address_line_2' => 'Avondale',
                'city' => 'Harare',
                'state_province' => 'Harare',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Prince Dube',
                'emergency_contact_phone' => '0778011299',
                'department' => 'CX',
                'job_title' => 'CXO',
                'line_manager' => 'tawanda_ndlovu',
                'approver' => 'nyasha_sibanda',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Avenues, Harare',
                'hire_date' => '2022-01-10',
                'probation_end_date' => '2022-04-10',
                'confirmation_date' => '2022-04-11',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2022-04-11',
                'notes' => 'Strong frontline customer care officer with potential for team leadership.',
                'is_active' => true,
            ],
            'rumbidzai_ncube' => [
                'employee_number' => 'FIN-011',
                'national_id' => '08-551244-N-52',
                'date_of_birth' => '1993-08-08',
                'gender' => 'female',
                'marital_status' => 'single',
                'personal_phone' => '0778022302',
                'home_address_line_1' => '14 Ascot Extension',
                'home_address_line_2' => 'Ascot',
                'city' => 'Bulawayo',
                'state_province' => 'Bulawayo',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Sithembile Ncube',
                'emergency_contact_phone' => '0778022399',
                'department' => 'FIN',
                'job_title' => 'FINO',
                'line_manager' => 'farirai_chihota',
                'approver' => 'chenai_gondo',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Belmont, Bulawayo',
                'hire_date' => '2023-02-13',
                'probation_end_date' => '2023-05-13',
                'confirmation_date' => '2023-05-14',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2023-05-14',
                'notes' => 'Reliable finance officer with strong reconciliation discipline.',
                'is_active' => true,
            ],
            'farai_muchengeti' => [
                'employee_number' => 'DIG-014',
                'national_id' => '63-482211-M-90',
                'date_of_birth' => '1992-10-17',
                'gender' => 'male',
                'marital_status' => 'single',
                'personal_phone' => '0778033403',
                'home_address_line_1' => '11 Madokero Phase 2',
                'home_address_line_2' => 'Madokero',
                'city' => 'Harare',
                'state_province' => 'Harare',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Tafadzwa Muchengeti',
                'emergency_contact_phone' => '0778033499',
                'department' => 'DIG',
                'job_title' => 'SA',
                'line_manager' => 'vimbai_mlambo',
                'approver' => 'kudzai_chirwa',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Newlands, Harare',
                'hire_date' => '2021-07-05',
                'probation_end_date' => '2021-10-05',
                'confirmation_date' => '2021-10-06',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2021-10-06',
                'notes' => 'Trusted systems analyst on mobile and payment platform stability.',
                'is_active' => true,
            ],
            'chiedza_nyoni' => [
                'employee_number' => 'CMB-006',
                'national_id' => '13-616772-N-11',
                'date_of_birth' => '1991-06-02',
                'gender' => 'female',
                'marital_status' => 'married',
                'personal_phone' => '0778044504',
                'home_address_line_1' => '6 Murambi East',
                'home_address_line_2' => 'Murambi',
                'city' => 'Mutare',
                'state_province' => 'Manicaland',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Tafara Nyoni',
                'emergency_contact_phone' => '0778044599',
                'department' => 'CMB',
                'job_title' => 'RM',
                'line_manager' => 'nyasha_sibanda',
                'approver' => 'kudzai_chirwa',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Mutare CBD',
                'hire_date' => '2020-02-10',
                'probation_end_date' => '2020-05-10',
                'confirmation_date' => '2020-05-11',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2020-05-11',
                'notes' => 'Commercial relationship manager for SME growth in Manicaland.',
                'is_active' => true,
            ],
            'tinashe_bhebhe' => [
                'employee_number' => 'OPS-015',
                'national_id' => '29-338811-B-84',
                'date_of_birth' => '1995-01-23',
                'gender' => 'male',
                'marital_status' => 'single',
                'personal_phone' => '0778055605',
                'home_address_line_1' => '31 Mkoba 12',
                'home_address_line_2' => 'Mkoba',
                'city' => 'Gweru',
                'state_province' => 'Midlands',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Lynette Bhebhe',
                'emergency_contact_phone' => '0778055699',
                'department' => 'OPS',
                'job_title' => 'OPA',
                'line_manager' => 'tawanda_ndlovu',
                'approver' => 'nyasha_sibanda',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Gweru Branch Hub',
                'hire_date' => '2022-09-19',
                'probation_end_date' => '2022-12-19',
                'confirmation_date' => '2022-12-20',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2022-12-20',
                'notes' => 'Operations analyst focused on queue times, controls, and branch discipline.',
                'is_active' => true,
            ],
            'nyari_musindo' => [
                'employee_number' => 'CX-009',
                'national_id' => '08-448211-M-17',
                'date_of_birth' => '1996-11-09',
                'gender' => 'female',
                'marital_status' => 'single',
                'personal_phone' => '0778066706',
                'home_address_line_1' => '22 Cowdray Park',
                'home_address_line_2' => 'Cowdray Park',
                'city' => 'Bulawayo',
                'state_province' => 'Bulawayo',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Lucky Musindo',
                'emergency_contact_phone' => '0778066799',
                'department' => 'CX',
                'job_title' => 'CXO',
                'line_manager' => 'tawanda_ndlovu',
                'approver' => 'nyasha_sibanda',
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'work_location' => 'Bulawayo Service Centre',
                'hire_date' => '2023-05-08',
                'probation_end_date' => '2023-08-08',
                'confirmation_date' => '2023-08-09',
                'is_review_eligible' => true,
                'review_eligibility_date' => '2023-08-09',
                'notes' => 'Customer care officer needing stronger evidence quality in performance submissions.',
                'is_active' => true,
            ],
            'tanaka_chikafa' => [
                'employee_number' => 'DIG-021',
                'national_id' => '11-551973-C-36',
                'date_of_birth' => '1998-04-01',
                'gender' => 'male',
                'marital_status' => 'single',
                'personal_phone' => '0778077807',
                'home_address_line_1' => '5 Kuwadzana 7',
                'home_address_line_2' => 'Kuwadzana',
                'city' => 'Harare',
                'state_province' => 'Harare',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Munashe Chikafa',
                'emergency_contact_phone' => '0778077899',
                'department' => 'DIG',
                'job_title' => 'PSO',
                'line_manager' => 'vimbai_mlambo',
                'approver' => 'kudzai_chirwa',
                'employment_status' => EmploymentStatus::Probation,
                'employment_type' => 'permanent',
                'work_location' => 'Newlands, Harare',
                'hire_date' => '2026-01-12',
                'probation_end_date' => '2026-04-12',
                'confirmation_date' => '2026-04-13',
                'is_review_eligible' => false,
                'review_eligibility_date' => '2026-07-13',
                'notes' => 'New starter on the digital support team.',
                'is_active' => true,
            ],
            'anesu_mudzimu' => [
                'employee_number' => 'HC-010',
                'national_id' => '05-111947-M-50',
                'date_of_birth' => '1990-12-30',
                'gender' => 'female',
                'marital_status' => 'single',
                'personal_phone' => '0778088908',
                'home_address_line_1' => '9 Dangamvura Phase 2',
                'home_address_line_2' => 'Dangamvura',
                'city' => 'Mutare',
                'state_province' => 'Manicaland',
                'postal_code' => '00263',
                'country' => 'Zimbabwe',
                'emergency_contact_name' => 'Brian Mudzimu',
                'emergency_contact_phone' => '0778088999',
                'department' => 'HC',
                'job_title' => 'HRBP',
                'line_manager' => 'tariro_chigumira',
                'approver' => 'rutendo_moyo',
                'employment_status' => EmploymentStatus::Exited,
                'employment_type' => 'contract',
                'work_location' => 'Mutare',
                'hire_date' => '2022-06-01',
                'probation_end_date' => '2022-09-01',
                'confirmation_date' => '2022-09-02',
                'is_review_eligible' => false,
                'review_eligibility_date' => null,
                'notes' => 'Past contractor retained in the sample data for status filtering.',
                'is_active' => false,
            ],
        ];
    }

    private function currentCycleScenarios(): array
    {
        return [
            [
                'cycle' => 'fy2026',
                'profile' => 'tatenda_dube',
                'final_state' => AppraisalStatus::GoalSetting,
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Reduce service recovery fee reversals in Harare CBD branch', 'kpi' => 'Monthly fee reversal value', 'target' => 'Keep avoidable fee reversals below USD 450 per month.', 'evidence' => 'Branch reversal register and daily exception tracker', 'due_date' => '2026-09-30'],
                    ['perspective' => 'customer', 'title' => 'Improve first-contact resolution for walk-in customer complaints', 'kpi' => 'First-contact resolution rate', 'target' => 'Reach 88% first-contact resolution by the end of Q3.', 'evidence' => 'Customer care dashboard and complaint log', 'due_date' => '2026-09-30'],
                    ['perspective' => 'internal_process', 'title' => 'Shorten complaint closure turnaround time', 'kpi' => 'Average closure days', 'target' => 'Reduce complaint closure time from 5 days to 2 days.', 'evidence' => 'Complaints workflow report', 'due_date' => '2026-08-31'],
                    ['perspective' => 'learning_growth', 'title' => 'Complete service excellence coaching programme', 'kpi' => 'Training completion and peer coaching sessions', 'target' => 'Finish the programme and facilitate 2 peer sessions.', 'evidence' => 'Learning portal certificate and branch coaching notes', 'due_date' => '2026-07-31'],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I consistently follow escalation standards on customer refunds.'],
                    ['code' => 'collaboration', 'employee_comment' => 'I work closely with tellers and branch operations on complaint resolution.'],
                    ['code' => 'customer_focus', 'employee_comment' => 'I prioritise same-day callback commitments for sensitive customer cases.'],
                ],
            ],
            [
                'cycle' => 'fy2026',
                'profile' => 'rumbidzai_ncube',
                'final_state' => AppraisalStatus::SelfAssessmentPending,
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Deliver month-end close by working day three', 'kpi' => 'Month-end close completion date', 'target' => 'Close the ledger by WD3 for every month in the cycle.', 'evidence' => 'Finance close checklist and sign-off pack', 'due_date' => '2026-12-31'],
                    ['perspective' => 'customer', 'title' => 'Improve finance support responsiveness for internal stakeholders', 'kpi' => 'Internal service response SLA', 'target' => 'Respond to finance queries within 24 hours for 95% of cases.', 'evidence' => 'Shared mailbox SLA report', 'due_date' => '2026-10-31'],
                    ['perspective' => 'internal_process', 'title' => 'Reduce unreconciled suspense items', 'kpi' => 'Outstanding suspense items over 30 days', 'target' => 'Keep aged suspense items below 5 at month end.', 'evidence' => 'Reconciliation dashboard and suspense tracker', 'due_date' => '2026-11-30'],
                    ['perspective' => 'learning_growth', 'title' => 'Complete IFRS refresher and train branch finance champions', 'kpi' => 'Training completion and branch sessions delivered', 'target' => 'Finish the refresher and lead 3 finance champion sessions.', 'evidence' => 'Training attendance register', 'due_date' => '2026-08-15'],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I keep supporting documents complete before any journal is posted.'],
                    ['code' => 'collaboration', 'employee_comment' => 'I support branch accountants with reconciliations every month.'],
                    ['code' => 'customer_focus', 'employee_comment' => 'I follow through until the requesting department receives a clear answer.'],
                ],
            ],
            [
                'cycle' => 'fy2026',
                'profile' => 'farai_muchengeti',
                'final_state' => AppraisalStatus::ManagerReviewPending,
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Reduce vendor penalty costs through stronger uptime control', 'kpi' => 'Monthly hosting penalty value', 'target' => 'Maintain zero avoidable hosting penalties for the review period.', 'evidence' => 'Vendor service review pack', 'due_date' => '2026-12-15', 'self_rating' => 4],
                    ['perspective' => 'customer', 'title' => 'Improve service desk satisfaction for digital incidents', 'kpi' => 'Average incident satisfaction score', 'target' => 'Reach an average incident satisfaction score of 4.5/5.', 'evidence' => 'Service desk satisfaction survey', 'due_date' => '2026-10-31', 'self_rating' => 4],
                    ['perspective' => 'internal_process', 'title' => 'Reduce severity-one incident recovery time', 'kpi' => 'Mean time to recovery', 'target' => 'Reduce MTTR for severity-one incidents to under 45 minutes.', 'evidence' => 'Incident postmortem log and monitoring dashboard', 'due_date' => '2026-09-30', 'self_rating' => 5],
                    ['perspective' => 'learning_growth', 'title' => 'Automate release-readiness checks for customer-facing systems', 'kpi' => 'Release checklist automation coverage', 'target' => 'Automate 80% of release-readiness checks by Q4.', 'evidence' => 'CI pipeline reports and release checklist', 'due_date' => '2026-11-15', 'self_rating' => 4],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I document every production change and rollback decision.', 'self_rating' => 4],
                    ['code' => 'collaboration', 'employee_comment' => 'I work closely with operations during incident triage.', 'self_rating' => 4],
                    ['code' => 'customer_focus', 'employee_comment' => 'I communicate outage updates clearly to frontline teams.', 'self_rating' => 5],
                ],
            ],
            [
                'cycle' => 'fy2026',
                'profile' => 'chiedza_nyoni',
                'final_state' => AppraisalStatus::ApprovalPending,
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Grow the SME lending portfolio in Mutare', 'kpi' => 'Net portfolio growth', 'target' => 'Deliver 12% net growth in the assigned SME portfolio.', 'evidence' => 'Portfolio growth report and disbursement tracker', 'due_date' => '2026-12-15', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'customer', 'title' => 'Improve SME portfolio client satisfaction', 'kpi' => 'Relationship NPS', 'target' => 'Achieve an SME portfolio NPS of at least 65.', 'evidence' => 'Client survey report', 'due_date' => '2026-10-31', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'internal_process', 'title' => 'Reduce KYC renewal backlog for top-value clients', 'kpi' => 'Outstanding overdue KYC renewals', 'target' => 'Clear all overdue KYC renewals older than 30 days.', 'evidence' => 'Compliance tracker and portfolio review minutes', 'due_date' => '2026-09-30', 'self_rating' => 3, 'manager_rating' => 4],
                    ['perspective' => 'learning_growth', 'title' => 'Coach junior relationship officers on credit discipline', 'kpi' => 'Coaching sessions completed', 'target' => 'Run 4 coaching sessions and publish a simple credit checklist.', 'evidence' => 'Coaching attendance register and checklist', 'due_date' => '2026-08-31', 'self_rating' => 4, 'manager_rating' => 5],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I keep credit approvals within delegated authority.', 'manager_comment' => 'Strong judgement on credit exceptions.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'collaboration', 'employee_comment' => 'I involve legal and operations early for complex facilities.', 'manager_comment' => 'Cross-functional coordination is improving well.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'customer_focus', 'employee_comment' => 'I stay close to client turnaround expectations.', 'manager_comment' => 'Clients consistently mention responsiveness.', 'self_rating' => 4, 'manager_rating' => 5],
                ],
            ],
            [
                'cycle' => 'fy2026',
                'profile' => 'tinashe_bhebhe',
                'final_state' => AppraisalStatus::Approved,
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Reduce branch overtime cost across Midlands sites', 'kpi' => 'Monthly overtime cost', 'target' => 'Lower overtime cost by 12% without service disruption.', 'evidence' => 'Payroll overtime report', 'due_date' => '2026-11-30', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'customer', 'title' => 'Improve branch queue waiting time in Gweru', 'kpi' => 'Average customer wait time', 'target' => 'Keep average queue waiting time below 9 minutes.', 'evidence' => 'Branch queue dashboard', 'due_date' => '2026-09-30', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'internal_process', 'title' => 'Raise branch cash balancing accuracy', 'kpi' => 'Daily balancing exception rate', 'target' => 'Achieve 99.5% same-day cash balancing accuracy.', 'evidence' => 'Branch balancing exceptions report', 'due_date' => '2026-12-15', 'self_rating' => 5, 'manager_rating' => 5],
                    ['perspective' => 'learning_growth', 'title' => 'Complete branch control certification', 'kpi' => 'Certification and control walkthrough completion', 'target' => 'Complete the certification and train 2 branch champions.', 'evidence' => 'Certification record and branch training register', 'due_date' => '2026-08-31', 'self_rating' => 4, 'manager_rating' => 4],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I maintain strong control evidence on branch exceptions.', 'manager_comment' => 'Control ownership is dependable.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'collaboration', 'employee_comment' => 'I work with branch supervisors during weekly control reviews.', 'manager_comment' => 'Good teamwork across regional branches.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'customer_focus', 'employee_comment' => 'I balance service speed with control discipline.', 'manager_comment' => 'Service consistency has improved visibly.', 'self_rating' => 4, 'manager_rating' => 4],
                ],
                'development_plan' => [
                    'strengths' => 'Tinashe keeps branch controls practical, calm, and consistent even during peak periods.',
                    'improvement_areas' => 'Needs more confidence presenting regional operational insights to senior management.',
                    'follow_up_notes' => 'Manager to review presentation readiness after the next quarterly branch forum.',
                    'actions' => [
                        ['action' => 'Present the Midlands branch control dashboard at the regional forum.', 'owner' => 'tinashe_bhebhe', 'due_date' => '2026-06-30', 'status' => DevelopmentActionStatus::InProgress, 'follow_up_status' => 'Draft presentation shared with manager.'],
                        ['action' => 'Shadow Nyasha during one senior operations review meeting.', 'owner' => 'nyasha_sibanda', 'due_date' => '2026-05-31', 'status' => DevelopmentActionStatus::Pending, 'follow_up_status' => 'Session not yet scheduled.'],
                    ],
                ],
            ],
            [
                'cycle' => 'fy2026',
                'profile' => 'nyari_musindo',
                'final_state' => AppraisalStatus::SentBack,
                'send_back_note' => 'Please strengthen your evidence on callback adherence and clarify the unresolved complaint backlog before approval.',
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Reduce avoidable service recovery credits in Bulawayo', 'kpi' => 'Monthly service recovery credit value', 'target' => 'Keep service recovery credits below USD 350 per month.', 'evidence' => 'Customer recovery tracker', 'due_date' => '2026-09-30', 'self_rating' => 3, 'manager_rating' => 3],
                    ['perspective' => 'customer', 'title' => 'Improve complaint callback adherence', 'kpi' => 'Callbacks completed within agreed timelines', 'target' => 'Reach 95% callback adherence on logged complaints.', 'evidence' => 'Callback register and CRM activity log', 'due_date' => '2026-09-30', 'self_rating' => 3, 'manager_rating' => 2],
                    ['perspective' => 'internal_process', 'title' => 'Reduce unresolved complaints older than 48 hours', 'kpi' => 'Open complaints older than 48 hours', 'target' => 'Maintain fewer than 4 unresolved complaints above 48 hours.', 'evidence' => 'Complaints ageing report', 'due_date' => '2026-08-31', 'self_rating' => 3, 'manager_rating' => 2],
                    ['perspective' => 'learning_growth', 'title' => 'Complete complaint handling refresher and mentor new hires', 'kpi' => 'Training completion and buddy check-ins', 'target' => 'Complete refresher training and mentor 2 new hires.', 'evidence' => 'Training register and buddy log', 'due_date' => '2026-07-31', 'self_rating' => 4, 'manager_rating' => 3],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I escalate complaint risks transparently.', 'manager_comment' => 'Escalation is timely, but documentation still needs more detail.', 'self_rating' => 4, 'manager_rating' => 3],
                    ['code' => 'collaboration', 'employee_comment' => 'I ask for help from branch staff when complaints span multiple teams.', 'manager_comment' => 'Needs stronger follow-through across teams.', 'self_rating' => 3, 'manager_rating' => 3],
                    ['code' => 'customer_focus', 'employee_comment' => 'I try to keep customers updated even when there are delays.', 'manager_comment' => 'Updates happen, but evidence of closure needs strengthening.', 'self_rating' => 4, 'manager_rating' => 2],
                ],
            ],
            [
                'cycle' => 'midyear_2026',
                'profile' => 'tanaka_chikafa',
                'final_state' => AppraisalStatus::Draft,
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Reduce avoidable third-party support tickets', 'kpi' => 'Third-party escalations per month', 'target' => 'Reduce avoidable third-party escalations by 20%.', 'evidence' => 'Support escalation log', 'due_date' => '2026-11-30'],
                    ['perspective' => 'customer', 'title' => 'Improve first-response SLA for digital support tickets', 'kpi' => 'Tickets responded to within SLA', 'target' => 'Achieve 97% first-response SLA for assigned tickets.', 'evidence' => 'Service desk SLA dashboard', 'due_date' => '2026-10-31'],
                    ['perspective' => 'internal_process', 'title' => 'Reduce recurring mobile app incidents', 'kpi' => 'Recurring incidents count', 'target' => 'Close the top 5 recurring incident root causes.', 'evidence' => 'Problem management board', 'due_date' => '2026-11-15'],
                    ['perspective' => 'learning_growth', 'title' => 'Complete cloud support certification', 'kpi' => 'Certification completion', 'target' => 'Pass the Azure support certification by Q4.', 'evidence' => 'Certification result and study tracker', 'due_date' => '2026-09-30'],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => ''],
                    ['code' => 'collaboration', 'employee_comment' => ''],
                    ['code' => 'customer_focus', 'employee_comment' => ''],
                ],
            ],
        ];
    }

    private function historicalScenarios(): array
    {
        return [
            [
                'profile' => 'tatenda_dube',
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Reduce service recovery fee reversals in Harare CBD branch', 'kpi' => 'Monthly fee reversal value', 'target' => 'Keep avoidable fee reversals below USD 500 per month.', 'evidence' => 'Branch reversal register', 'due_date' => '2025-09-30', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'customer', 'title' => 'Improve first-contact resolution for walk-in customer complaints', 'kpi' => 'First-contact resolution rate', 'target' => 'Reach 85% first-contact resolution.', 'evidence' => 'Customer care dashboard', 'due_date' => '2025-09-30', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'internal_process', 'title' => 'Shorten complaint closure turnaround time', 'kpi' => 'Average closure days', 'target' => 'Reduce complaint closure time from 6 days to 3 days.', 'evidence' => 'Complaints workflow report', 'due_date' => '2025-08-31', 'self_rating' => 4, 'manager_rating' => 3],
                    ['perspective' => 'learning_growth', 'title' => 'Complete service excellence coaching programme', 'kpi' => 'Training completion', 'target' => 'Complete the programme and facilitate one coaching session.', 'evidence' => 'Learning portal certificate', 'due_date' => '2025-07-31', 'self_rating' => 4, 'manager_rating' => 4],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I maintained accurate case records.', 'manager_comment' => 'Dependable service discipline.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'collaboration', 'employee_comment' => 'I partnered well with branch operations.', 'manager_comment' => 'Teamwork remained strong all year.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'customer_focus', 'employee_comment' => 'I protected customer confidence during escalations.', 'manager_comment' => 'Customer focus was a visible strength.', 'self_rating' => 4, 'manager_rating' => 4],
                ],
                'development_plan' => [
                    'strengths' => 'Tatenda built strong trust with repeat customers and branch colleagues.',
                    'improvement_areas' => 'Needs stronger root-cause analysis on repeat complaint themes.',
                    'follow_up_notes' => 'Manager to review monthly complaint trend analysis output.',
                    'actions' => [
                        ['action' => 'Prepare a monthly repeat-complaint trend summary.', 'owner' => 'tatenda_dube', 'due_date' => '2026-02-28', 'status' => DevelopmentActionStatus::Completed, 'follow_up_status' => 'Completed and reviewed.'],
                        ['action' => 'Attend customer journey mapping workshop.', 'owner' => 'tariro_chigumira', 'due_date' => '2026-01-31', 'status' => DevelopmentActionStatus::Completed, 'follow_up_status' => 'Workshop attendance confirmed.'],
                    ],
                ],
            ],
            [
                'profile' => 'rumbidzai_ncube',
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Deliver month-end close by working day three', 'kpi' => 'Month-end close completion date', 'target' => 'Close the ledger by WD3 for every month.', 'evidence' => 'Finance close checklist', 'due_date' => '2025-12-31', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'customer', 'title' => 'Improve finance support responsiveness for internal stakeholders', 'kpi' => 'Internal service response SLA', 'target' => 'Respond within 24 hours for 90% of cases.', 'evidence' => 'Shared mailbox report', 'due_date' => '2025-10-31', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'internal_process', 'title' => 'Reduce unreconciled suspense items', 'kpi' => 'Outstanding suspense items over 30 days', 'target' => 'Keep aged suspense items below 7.', 'evidence' => 'Suspense tracker', 'due_date' => '2025-11-30', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'learning_growth', 'title' => 'Complete IFRS refresher and train branch finance champions', 'kpi' => 'Training completion', 'target' => 'Finish refresher and run 2 champion sessions.', 'evidence' => 'Training attendance register', 'due_date' => '2025-08-15', 'self_rating' => 3, 'manager_rating' => 4],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I posted journals only with complete support.', 'manager_comment' => 'Strong control discipline throughout the year.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'collaboration', 'employee_comment' => 'I stayed close to branch accountants during month-end.', 'manager_comment' => 'Reliable partner across finance operations.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'customer_focus', 'employee_comment' => 'I followed through on stakeholder requests clearly.', 'manager_comment' => 'Good responsiveness to internal customers.', 'self_rating' => 4, 'manager_rating' => 4],
                ],
                'development_plan' => [
                    'strengths' => 'Rumbidzai is dependable on reconciliations, close discipline, and financial accuracy.',
                    'improvement_areas' => 'Should build more confidence in presenting finance insights to non-finance teams.',
                    'follow_up_notes' => 'Finance manager to schedule one presentation slot in the next business review.',
                    'actions' => [
                        ['action' => 'Present one monthly finance highlight pack to branch leads.', 'owner' => 'rumbidzai_ncube', 'due_date' => '2026-03-31', 'status' => DevelopmentActionStatus::InProgress, 'follow_up_status' => 'First draft shared with manager.'],
                        ['action' => 'Coach on finance storytelling for non-finance audiences.', 'owner' => 'farirai_chihota', 'due_date' => '2026-02-28', 'status' => DevelopmentActionStatus::Completed, 'follow_up_status' => 'Coaching session completed.'],
                    ],
                ],
            ],
            [
                'profile' => 'farai_muchengeti',
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Reduce vendor penalty costs through stronger uptime control', 'kpi' => 'Monthly hosting penalty value', 'target' => 'Maintain zero avoidable hosting penalties.', 'evidence' => 'Vendor service review pack', 'due_date' => '2025-12-15', 'self_rating' => 4, 'manager_rating' => 5],
                    ['perspective' => 'customer', 'title' => 'Improve service desk satisfaction for digital incidents', 'kpi' => 'Average incident satisfaction score', 'target' => 'Reach 4.4/5 incident satisfaction.', 'evidence' => 'Service desk survey', 'due_date' => '2025-10-31', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'internal_process', 'title' => 'Reduce severity-one incident recovery time', 'kpi' => 'Mean time to recovery', 'target' => 'Reduce MTTR to under 50 minutes.', 'evidence' => 'Incident postmortem log', 'due_date' => '2025-09-30', 'self_rating' => 5, 'manager_rating' => 5],
                    ['perspective' => 'learning_growth', 'title' => 'Automate release-readiness checks for customer-facing systems', 'kpi' => 'Automation coverage', 'target' => 'Automate 70% of release-readiness checks.', 'evidence' => 'CI pipeline reports', 'due_date' => '2025-11-15', 'self_rating' => 4, 'manager_rating' => 4],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I documented every production change in detail.', 'manager_comment' => 'Excellent operational discipline.', 'self_rating' => 4, 'manager_rating' => 5],
                    ['code' => 'collaboration', 'employee_comment' => 'I worked well with operations during outages.', 'manager_comment' => 'Very strong cross-team coordination.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'customer_focus', 'employee_comment' => 'I kept frontline teams updated during major incidents.', 'manager_comment' => 'Clear, calm communication under pressure.', 'self_rating' => 5, 'manager_rating' => 5],
                ],
                'development_plan' => [
                    'strengths' => 'Farai performs strongly in reliability, incident control, and technical ownership.',
                    'improvement_areas' => 'Should spend more time mentoring junior support analysts.',
                    'follow_up_notes' => 'Digital manager to pair Farai with Tanaka for structured mentoring.',
                    'actions' => [
                        ['action' => 'Run a monthly postmortem learning session for the support team.', 'owner' => 'farai_muchengeti', 'due_date' => '2026-03-31', 'status' => DevelopmentActionStatus::InProgress, 'follow_up_status' => 'Two sessions completed so far.'],
                        ['action' => 'Create a support analyst onboarding checklist.', 'owner' => 'vimbai_mlambo', 'due_date' => '2026-02-15', 'status' => DevelopmentActionStatus::Completed, 'follow_up_status' => 'Checklist published.'],
                    ],
                ],
            ],
            [
                'profile' => 'chiedza_nyoni',
                'objectives' => [
                    ['perspective' => 'financial', 'title' => 'Grow the SME lending portfolio in Mutare', 'kpi' => 'Net portfolio growth', 'target' => 'Deliver 10% net portfolio growth.', 'evidence' => 'Portfolio growth report', 'due_date' => '2025-12-15', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'customer', 'title' => 'Improve SME portfolio client satisfaction', 'kpi' => 'Relationship NPS', 'target' => 'Achieve an NPS of 60.', 'evidence' => 'Client survey report', 'due_date' => '2025-10-31', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'internal_process', 'title' => 'Reduce KYC renewal backlog for top-value clients', 'kpi' => 'Outstanding overdue KYC renewals', 'target' => 'Clear all KYC renewals older than 45 days.', 'evidence' => 'Compliance tracker', 'due_date' => '2025-09-30', 'self_rating' => 4, 'manager_rating' => 4],
                    ['perspective' => 'learning_growth', 'title' => 'Coach junior relationship officers on credit discipline', 'kpi' => 'Coaching sessions completed', 'target' => 'Run 3 coaching sessions and publish a checklist.', 'evidence' => 'Coaching register', 'due_date' => '2025-08-31', 'self_rating' => 4, 'manager_rating' => 5],
                ],
                'competencies' => [
                    ['code' => 'integrity', 'employee_comment' => 'I stayed within delegated authority limits.', 'manager_comment' => 'Good control discipline across the year.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'collaboration', 'employee_comment' => 'I worked closely with operations and compliance.', 'manager_comment' => 'Cross-functional partnership improved well.', 'self_rating' => 4, 'manager_rating' => 4],
                    ['code' => 'customer_focus', 'employee_comment' => 'I kept clients updated on turnaround expectations.', 'manager_comment' => 'Strong client responsiveness throughout the cycle.', 'self_rating' => 4, 'manager_rating' => 5],
                ],
                'development_plan' => [
                    'strengths' => 'Chiedza builds trusted client relationships and follows through on growth opportunities.',
                    'improvement_areas' => 'Should deepen pipeline review discipline and strategic portfolio planning.',
                    'follow_up_notes' => 'Approver to review pipeline discipline in the next calibration meeting.',
                    'actions' => [
                        ['action' => 'Complete advanced portfolio planning coaching with the approving manager.', 'owner' => 'chiedza_nyoni', 'due_date' => '2026-03-15', 'status' => DevelopmentActionStatus::Completed, 'follow_up_status' => 'Coaching completed and reflected in pipeline reviews.'],
                        ['action' => 'Review quarterly pipeline discipline with Chiedza.', 'owner' => 'nyasha_sibanda', 'due_date' => '2026-01-31', 'status' => DevelopmentActionStatus::Completed, 'follow_up_status' => 'Review completed.'],
                    ],
                ],
            ],
        ];
    }

    private function restoreOrCreate(string $modelClass, array $attributes, array $values): Model
    {
        /** @var Model $model */
        $model = $modelClass::withTrashed()->firstOrNew($attributes);
        $model->fill($values);

        if (method_exists($model, 'trashed') && $model->trashed()) {
            $model->restore();
        }

        $model->save();

        return $model;
    }
}
