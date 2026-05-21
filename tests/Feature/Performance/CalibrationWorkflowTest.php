<?php

use App\Enums\AppraisalStatus;
use App\Enums\RatingScaleType;
use App\Enums\WorkflowStage;
use App\Models\Appraisal;
use App\Models\AppraisalCalibration;
use App\Models\AppraisalCompetencyRating;
use App\Models\AppraisalObjective;
use App\Models\AppraisalTemplate;
use App\Models\Competency;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\RatingScale;
use App\Models\RatingScaleLevel;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\AppraisalNavigationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('manager can access and resubmit manager review after approval send back to self assessment', function () {
    [$appraisal] = createAppraisalForCalibrationFlow([
        'status' => AppraisalStatus::ApprovalPending,
        'self_assessment_submitted_at' => now()->subDays(3),
        'manager_reviewed_at' => now()->subDays(2),
    ]);

    $approver = User::factory()->create(['is_approved' => true]);
    $manager = User::factory()->create(['is_approved' => true]);
    $appraisal->update([
        'approving_manager_user_id' => $approver->id,
        'line_manager_user_id' => $manager->id,
    ]);

    grantCalibrationPermissions($approver, ['performance.appraisals.approve']);
    grantCalibrationPermissions($manager, ['performance.appraisals.manager_review']);

    $this->actingAs($approver)
        ->post(route('performance.appraisals.approval.store', $appraisal), [
            'decision' => 'send_back',
            'comment' => 'Please update your self assessment.',
            'reopened_stage' => 'self_assessment',
        ])
        ->assertRedirect();

    $appraisal->refresh();

    expect($appraisal->status)->toBe(AppraisalStatus::SentBack)
        ->and($appraisal->reopened_stage)->toBe(WorkflowStage::SelfAssessment)
        ->and($appraisal->self_assessment_submitted_at)->toBeNull()
        ->and($appraisal->manager_reviewed_at)->not->toBeNull();

    $this->actingAs($manager)
        ->get(route('performance.appraisals.manager_review', $appraisal))
        ->assertOk();

    $objective = $appraisal->objectives()->firstOrFail();
    $level = $objective->manager_rating_scale_level_id;

    $this->actingAs($manager)
        ->post(route('performance.appraisals.manager_review.submit', $appraisal), [
            'objectives' => [
                [
                    'id' => $objective->id,
                    'manager_rating_scale_level_id' => $level,
                    'manager_comment' => 'Updated after send back.',
                ],
            ],
            'comment' => 'Forwarding after attempted early submit.',
        ])
        ->assertSessionHasErrors('appraisal');

    $employee = User::query()->findOrFail($appraisal->employee_user_id);
    grantCalibrationPermissions($employee, [
        'performance.appraisals.view_own',
        'performance.appraisals.self_assess',
    ]);

    $appraisal->load('template');
    $objectiveForSelf = $appraisal->objectives()->firstOrFail();
    $selfLevel = $objectiveForSelf->self_rating_scale_level_id
        ?? RatingScaleLevel::query()->where('rating_scale_id', $appraisal->template->objective_rating_scale_id)->value('id');

    $this->actingAs($employee)
        ->put(route('performance.appraisals.self_assessment.update', $appraisal), [
            'objectives' => [
                [
                    'id' => $objectiveForSelf->id,
                    'performance_achieved' => 'Updated achievement narrative.',
                    'self_rating_scale_level_id' => $selfLevel,
                    'employee_comment' => 'Resubmitted after send back.',
                ],
            ],
            'achievement_note' => '',
            'significant_issue' => '',
        ])
        ->assertRedirect();

    $this->actingAs($employee)
        ->post(route('performance.appraisals.self_assessment.submit', $appraisal))
        ->assertRedirect();

    $appraisal->refresh();

    expect($appraisal->status)->toBe(AppraisalStatus::ManagerReviewPending)
        ->and($appraisal->manager_reviewed_at)->toBeNull();

    $this->actingAs($manager)
        ->get(route('performance.appraisals.manager_review', $appraisal))
        ->assertOk();

    $this->actingAs($manager)
        ->post(route('performance.appraisals.manager_review.submit', $appraisal), [
            'objectives' => [
                [
                    'id' => $objective->id,
                    'manager_rating_scale_level_id' => $level,
                    'manager_comment' => 'Updated after employee resubmitted.',
                ],
            ],
            'comment' => 'Manager review rework complete.',
        ])
        ->assertRedirect();

    $appraisal->refresh();

    expect($appraisal->status)->toBe(AppraisalStatus::ApprovalPending)
        ->and($appraisal->reopened_stage)->toBeNull()
        ->and($appraisal->manager_reviewed_at)->not->toBeNull();
});

test('approval send back redirects to appraisal overview when actor cannot open reopened stage', function () {
    [$appraisal] = createAppraisalForCalibrationFlow();
    $approver = User::factory()->create(['is_approved' => true]);
    $appraisal->update(['approving_manager_user_id' => $approver->id]);
    grantCalibrationPermissions($approver, ['performance.appraisals.approve']);

    $this->actingAs($approver)
        ->post(route('performance.appraisals.approval.store', $appraisal), [
            'decision' => 'send_back',
            'comment' => 'Please update your self assessment.',
            'reopened_stage' => 'self_assessment',
        ])
        ->assertRedirect(route('performance.appraisals.show', ['appraisal' => $appraisal, 'overview' => 1]));

    $appraisal->refresh();

    expect($appraisal->status)->toBe(AppraisalStatus::SentBack)
        ->and($appraisal->reopened_stage)->toBe(WorkflowStage::SelfAssessment);
});

test('approval send back redirects to reopened stage and navigation accepts enum reopened stage', function () {
    [$appraisal] = createAppraisalForCalibrationFlow();
    $approver = User::factory()->create(['is_approved' => true]);
    $appraisal->update(['approving_manager_user_id' => $approver->id]);
    grantCalibrationPermissions($approver, ['performance.appraisals.approve', 'performance.appraisals.manager_review']);

    $this->actingAs($approver)
        ->post(route('performance.appraisals.approval.store', $appraisal), [
            'decision' => 'send_back',
            'comment' => 'Please revise manager ratings.',
            'reopened_stage' => 'manager_review',
        ])
        ->assertRedirect(route('performance.appraisals.manager_review', $appraisal));

    $appraisal->refresh();

    expect($appraisal->status)->toBe(AppraisalStatus::SentBack)
        ->and($appraisal->reopened_stage)->toBe(WorkflowStage::ManagerReview);

    expect(app(AppraisalNavigationService::class)->continueRoute($appraisal, $approver))
        ->toBe(route('performance.appraisals.manager_review', $appraisal));

    $this->actingAs($approver)
        ->get(route('performance.appraisals.show', $appraisal))
        ->assertRedirect(route('performance.appraisals.manager_review', $appraisal));
});

test('approver approval moves appraisal to calibration pending', function () {
    [$appraisal, $overallScale] = createAppraisalForCalibrationFlow();
    $approver = User::factory()->create(['is_approved' => true]);
    $appraisal->update(['approving_manager_user_id' => $approver->id]);
    grantCalibrationPermissions($approver, ['performance.appraisals.approve']);

    $this->actingAs($approver)
        ->post(route('performance.appraisals.approval.store', $appraisal), [
            'decision' => 'approve',
            'comment' => 'Approved and forwarded to calibration.',
        ])
        ->assertRedirect();

    $appraisal->refresh();

    expect($appraisal->status)->toBe(AppraisalStatus::CalibrationPending)
        ->and($appraisal->approved_at)->not->toBeNull()
        ->and($appraisal->overall_rating_scale_level_id)->toBe($overallScale['high']->id);
});

test('appraisal cannot be finalized before calibration is completed', function () {
    [$appraisal] = createAppraisalForCalibrationFlow([
        'status' => AppraisalStatus::CalibrationPending,
        'approved_at' => now(),
    ]);

    $finalizer = User::factory()->create(['is_approved' => true]);
    grantCalibrationPermissions($finalizer, ['performance.appraisals.finalize']);

    $this->actingAs($finalizer)
        ->post(route('performance.appraisals.finalize.store', $appraisal), [
            'comment' => 'Attempting to finalize too early.',
        ])
        ->assertForbidden();
});

test('calibration confirm makes appraisal ready for finalization', function () {
    [$appraisal] = createAppraisalForCalibrationFlow([
        'status' => AppraisalStatus::CalibrationPending,
        'approved_at' => now(),
        'overall_score' => 96,
    ]);

    $calibrator = User::factory()->create(['is_approved' => true]);
    $finalizer = User::factory()->create(['is_approved' => true]);
    grantCalibrationPermissions($calibrator, ['performance.appraisals.calibrate']);
    grantCalibrationPermissions($finalizer, ['performance.appraisals.finalize']);

    $this->actingAs($calibrator)
        ->post(route('performance.appraisals.calibration.store', $appraisal), [
            'decision' => 'confirmed',
            'comment' => 'Committee confirmed the approved result.',
            'evidence_summary' => '',
        ])
        ->assertRedirect();

    $appraisal->refresh();

    expect($appraisal->calibrated_at)->not->toBeNull()
        ->and($appraisal->calibrated_overall_score)->toBe('96.00');

    $this->actingAs($finalizer)
        ->get(route('performance.appraisals.finalize', $appraisal))
        ->assertOk();
});

test('calibration adjustment resolves final rating from score using the overall scale', function () {
    [$baseAppraisal, $overallScale] = createAppraisalForCalibrationFlow();
    $baseAppraisal->update([
        'status' => AppraisalStatus::CalibrationPending,
        'approved_at' => now(),
        'overall_score' => 96,
        'overall_rating_scale_level_id' => $overallScale['high']->id,
    ]);
    $appraisal = $baseAppraisal->fresh();

    $calibrator = User::factory()->create(['is_approved' => true]);
    grantCalibrationPermissions($calibrator, ['performance.appraisals.calibrate']);

    $this->actingAs($calibrator)
        ->post(route('performance.appraisals.calibration.store', $appraisal), [
            'decision' => 'adjusted',
            'comment' => 'Committee reduced the final outcome after moderation.',
            'evidence_summary' => 'Cross-team moderation notes.',
            'calibrated_overall_score' => 72,
            'calibrated_overall_rating_scale_level_id' => $overallScale['high']->id,
        ])
        ->assertRedirect();

    $appraisal->refresh();

    expect($appraisal->calibrated_overall_rating_scale_level_id)->toBe($overallScale['medium']->id);
});

test('calibration adjustment can attach evidence files', function () {
    Storage::fake('public');

    [$baseAppraisal, $overallScale] = createAppraisalForCalibrationFlow();
    $baseAppraisal->update([
        'status' => AppraisalStatus::CalibrationPending,
        'approved_at' => now(),
        'overall_score' => 96,
        'overall_rating_scale_level_id' => $overallScale['high']->id,
    ]);
    $appraisal = $baseAppraisal->fresh();

    $calibrator = User::factory()->create(['is_approved' => true]);
    grantCalibrationPermissions($calibrator, ['performance.appraisals.calibrate']);

    $this->actingAs($calibrator)
        ->post(route('performance.appraisals.calibration.store', $appraisal), [
            'decision' => 'adjusted',
            'comment' => 'Committee reduced the final outcome after moderation.',
            'evidence_summary' => '',
            'calibrated_overall_score' => 72,
            'calibrated_overall_rating_scale_level_id' => $overallScale['medium']->id,
            'evidence_files' => [
                UploadedFile::fake()->create('moderation-notes.pdf', 120, 'application/pdf'),
            ],
        ])
        ->assertRedirect();

    $calibration = AppraisalCalibration::query()->where('appraisal_id', $appraisal->id)->first();

    expect($calibration)->not->toBeNull()
        ->and($calibration->evidences)->toHaveCount(1)
        ->and($calibration->evidences->first()->original_name)->toBe('moderation-notes.pdf');
});

test('calibration adjustment stores override without mutating manager ratings', function () {
    [$baseAppraisal, $overallScale] = createAppraisalForCalibrationFlow();
    $baseAppraisal->update([
        'status' => AppraisalStatus::CalibrationPending,
        'approved_at' => now(),
        'overall_score' => 96,
        'overall_rating_scale_level_id' => $overallScale['high']->id,
    ]);
    $appraisal = $baseAppraisal->fresh();

    $objective = $appraisal->objectives()->firstOrFail();
    $competencyRating = $appraisal->competencyRatings()->firstOrFail();
    $calibrator = User::factory()->create(['is_approved' => true]);
    grantCalibrationPermissions($calibrator, ['performance.appraisals.calibrate']);

    $this->actingAs($calibrator)
        ->post(route('performance.appraisals.calibration.store', $appraisal), [
            'decision' => 'adjusted',
            'comment' => 'Committee reduced the final outcome after moderation.',
            'evidence_summary' => 'Cross-team moderation notes and forced distribution review.',
            'calibrated_overall_score' => 72,
            'calibrated_overall_rating_scale_level_id' => $overallScale['medium']->id,
        ])
        ->assertRedirect();

    $appraisal->refresh();
    $objective->refresh();
    $competencyRating->refresh();

    expect($appraisal->overall_score)->toBe('96.00')
        ->and($appraisal->calibrated_overall_score)->toBe('72.00')
        ->and($appraisal->overall_rating_scale_level_id)->toBe($overallScale['high']->id)
        ->and($appraisal->calibrated_overall_rating_scale_level_id)->toBe($overallScale['medium']->id)
        ->and($objective->manager_rating_score)->toBe('5.00')
        ->and($competencyRating->manager_rating_score)->toBe('4.00');
});

test('employee can view a completed self assessment step while manager review is pending', function () {
    [$appraisal] = createAppraisalForCalibrationFlow([
        'status' => AppraisalStatus::ManagerReviewPending,
        'goal_submitted_at' => now()->subDays(4),
        'self_assessment_submitted_at' => now()->subDay(),
    ]);

    $employee = User::query()->findOrFail($appraisal->employee_user_id);
    grantCalibrationPermissions($employee, [
        'performance.appraisals.view_own',
        'performance.appraisals.self_assess',
    ]);

    expect($employee->can('viewSelfAssessment', $appraisal))->toBeTrue()
        ->and($employee->can('selfAssess', $appraisal))->toBeFalse();

    $this->actingAs($employee)
        ->get(route('performance.appraisals.self_assessment', $appraisal))
        ->assertOk();
});

test('manager can view self assessment after employee submission', function () {
    [$appraisal] = createAppraisalForCalibrationFlow([
        'status' => AppraisalStatus::ManagerReviewPending,
        'goal_submitted_at' => now()->subDays(4),
        'self_assessment_submitted_at' => now()->subDay(),
    ]);

    $manager = User::factory()->create(['is_approved' => true]);
    $appraisal->update(['line_manager_user_id' => $manager->id]);
    grantCalibrationPermissions($manager, ['performance.appraisals.manager_review']);

    $this->actingAs($manager)
        ->get(route('performance.appraisals.self_assessment', $appraisal))
        ->assertOk();
});

function createAppraisalForCalibrationFlow(array $appraisalOverrides = []): array
{
    $employeeUser = User::factory()->create(['is_approved' => true]);
    $profile = EmployeeProfile::factory()->create([
        'user_id' => $employeeUser->id,
        'line_manager_user_id' => User::factory()->create(['is_approved' => true])->id,
        'approving_manager_user_id' => User::factory()->create(['is_approved' => true])->id,
    ]);

    $objectiveScale = RatingScale::create([
        'name' => 'Objective Scale',
        'code' => 'objective-scale',
        'applies_to' => RatingScaleType::Objective,
        'description' => 'Objective ratings',
        'is_active' => true,
    ]);

    $competencyScale = RatingScale::create([
        'name' => 'Values Scale',
        'code' => 'values-scale',
        'applies_to' => RatingScaleType::Competency,
        'description' => 'Values ratings',
        'is_active' => true,
    ]);

    $overallScale = RatingScale::create([
        'name' => 'Overall Scale',
        'code' => 'overall-scale',
        'applies_to' => RatingScaleType::Overall,
        'description' => 'Overall ratings',
        'is_active' => true,
    ]);

    $objectiveLevel = RatingScaleLevel::create([
        'rating_scale_id' => $objectiveScale->id,
        'label' => 'Outstanding',
        'short_label' => 'O',
        'value' => 5,
        'min_percent' => 80,
        'max_percent' => 100,
        'color' => '#385144',
        'sort_order' => 1,
        'is_default' => true,
    ]);

    $competencyLevel = RatingScaleLevel::create([
        'rating_scale_id' => $competencyScale->id,
        'label' => 'Strong',
        'short_label' => 'S',
        'value' => 4,
        'min_percent' => 60,
        'max_percent' => 79.99,
        'color' => '#C2D8C4',
        'sort_order' => 1,
        'is_default' => true,
    ]);

    $overallHigh = RatingScaleLevel::create([
        'rating_scale_id' => $overallScale->id,
        'label' => 'Exceeds Expectations',
        'short_label' => 'EE',
        'value' => 5,
        'min_percent' => 80,
        'max_percent' => 100,
        'color' => '#385144',
        'sort_order' => 1,
        'is_default' => true,
    ]);

    $overallMedium = RatingScaleLevel::create([
        'rating_scale_id' => $overallScale->id,
        'label' => 'Meets Expectations',
        'short_label' => 'ME',
        'value' => 3,
        'min_percent' => 60,
        'max_percent' => 79.99,
        'color' => '#C2D8C4',
        'sort_order' => 2,
        'is_default' => false,
    ]);

    $template = AppraisalTemplate::factory()->create([
        'objective_rating_scale_id' => $objectiveScale->id,
        'competency_rating_scale_id' => $competencyScale->id,
        'overall_rating_scale_id' => $overallScale->id,
    ]);

    $cycle = ReviewCycle::factory()->create();
    $perspective = Perspective::create([
        'name' => 'Customer',
        'code' => 'customer',
        'description' => 'Customer perspective',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $competency = Competency::create([
        'name' => 'Collaboration',
        'code' => 'collaboration',
        'description' => 'Works well with others',
        'category' => 'value',
        'department_id' => $profile->department_id,
        'job_title_id' => $profile->job_title_id,
        'is_active' => true,
    ]);

    $appraisal = Appraisal::factory()->create(array_merge([
        'review_cycle_id' => $cycle->id,
        'employee_profile_id' => $profile->id,
        'template_id' => $template->id,
        'employee_user_id' => $profile->user_id,
        'line_manager_user_id' => $profile->line_manager_user_id,
        'approving_manager_user_id' => $profile->approving_manager_user_id,
        'status' => AppraisalStatus::ApprovalPending,
        'goal_submitted_at' => now()->subDays(5),
        'self_assessment_submitted_at' => now()->subDays(4),
        'manager_reviewed_at' => now()->subDays(3),
    ], $appraisalOverrides));

    AppraisalObjective::create([
        'appraisal_id' => $appraisal->id,
        'perspective_id' => $perspective->id,
        'objective_type' => 'business',
        'title' => 'Improve release quality',
        'kpi_measure' => 'Defect escape rate',
        'target_definition' => 'Reduce production defects by 20%',
        'weight' => 100,
        'evidence_source' => 'Release dashboard',
        'manager_rating_scale_level_id' => $objectiveLevel->id,
        'manager_rating_score' => 5,
        'include_in_business_score' => true,
        'sort_order' => 1,
    ]);

    AppraisalCompetencyRating::create([
        'appraisal_id' => $appraisal->id,
        'competency_id' => $competency->id,
        'manager_rating_scale_level_id' => $competencyLevel->id,
        'manager_rating_score' => 4,
        'sort_order' => 1,
    ]);

    return [$appraisal->fresh(), ['high' => $overallHigh, 'medium' => $overallMedium]];
}

function grantCalibrationPermissions(User $user, array $permissions): void
{
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);
}
