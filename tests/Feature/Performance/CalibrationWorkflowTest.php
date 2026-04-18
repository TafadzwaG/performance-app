<?php

use App\Enums\AppraisalStatus;
use App\Enums\RatingScaleType;
use App\Models\Appraisal;
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
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

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
