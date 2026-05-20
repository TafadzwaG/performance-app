<?php

use App\Enums\AppraisalStatus;
use App\Enums\RatingScaleType;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\RatingScale;
use App\Models\RatingScaleLevel;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\ReportQueryService;
use Illuminate\Support\Facades\Cache;

test('dashboard includes expanded operational statistics', function () {
    Cache::flush();
    $today = now()->toDateString();
    $manager = User::factory()->create(['name' => 'Manager One']);
    $approver = User::factory()->create(['name' => 'Approver One']);
    $employee = User::factory()->create(['name' => 'Employee One']);
    $dashboardUser = User::factory()->create(['name' => 'Dashboard User']);
    $dashboardUser->givePermissionTo(Permission::findOrCreate('performance.reports.view', 'web'));

    $sales = Department::factory()->create(['name' => 'Sales']);
    $support = Department::factory()->create(['name' => 'Support']);

    EmployeeProfile::factory()->for($dashboardUser)->for($sales)->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
    ]);

    $assignedProfile = EmployeeProfile::factory()->for($employee)->for($sales)->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
    ]);

    EmployeeProfile::factory()->for(User::factory())->for($support)->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
    ]);

    $cycle = ReviewCycle::factory()->create([
        'name' => '2026 Review',
        'code' => '2026',
        'status' => ReviewCycleStatus::Open,
        'start_date' => now()->subMonth(),
        'end_date' => now()->addMonth(),
        'goal_setting_deadline' => now()->subDays(2),
        'self_assessment_deadline' => now()->subDays(5),
        'manager_review_deadline' => now()->subDays(9),
        'approval_deadline' => now()->addDays(4),
    ]);

    $previousCycle = ReviewCycle::factory()->create([
        'name' => '2025 Review',
        'code' => '2025',
        'status' => ReviewCycleStatus::Closed,
        'end_date' => now()->subYear(),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for($assignedProfile, 'employeeProfile')->create([
        'employee_user_id' => $employee->id,
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::SelfAssessmentPending,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2026 Review',
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($sales), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::ManagerReviewPending,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2026 Review',
        'self_assessment_submitted_at' => now()->subDays(10),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($support), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::ApprovalPending,
        'department_name_snapshot' => 'Support',
        'cycle_name_snapshot' => '2026 Review',
        'manager_reviewed_at' => now()->subDays(3),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($support), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::Finalized,
        'department_name_snapshot' => 'Support',
        'cycle_name_snapshot' => '2026 Review',
        'business_score' => 80,
        'values_score' => 70,
        'overall_score' => 78,
        'finalized_at' => now(),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($sales), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::SentBack,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2026 Review',
    ]);

    Appraisal::factory()->for($previousCycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($sales), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::Finalized,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2025 Review',
        'overall_score' => 68,
        'finalized_at' => now()->subYear(),
    ]);

    $dashboard = app(ReportQueryService::class)->dashboard($dashboardUser);

    expect($dashboard['stage_completion'])->toContain([
        'stage' => 'Self Assessment',
        'completed' => 4,
        'total' => 5,
        'completion_rate' => 80.0,
    ])
        ->and($dashboard['overdue_severity'][1])->toMatchArray(['bucket' => '4-7 days', 'total' => 1])
        ->and($dashboard['overdue_severity'][2])->toMatchArray(['bucket' => '8+ days', 'total' => 1])
        ->and($dashboard['cycle_health']['status'])->toBe('amber')
        ->and($dashboard['manager_workload'][0])->toMatchArray(['manager' => 'Manager One', 'pending_reviews' => 1, 'overdue_reviews' => 2])
        ->and($dashboard['department_risk'][0])->toHaveKeys(['department', 'completion_rate', 'overdue_rate', 'average_score', 'risk_score'])
        ->and($dashboard['score_quality'])->toMatchArray([
            'average_score' => 78.0,
            'median_score' => 78.0,
            'score_spread' => 0.0,
            'business_values_gap' => 10.0,
            'unrated_finalized_reviews' => 0,
        ])
        ->and($dashboard['rework'])->toMatchArray(['sent_back_count' => 1, 'sent_back_rate' => 20.0])
        ->and($dashboard['coverage'])->toMatchArray(['eligible_employees' => 8, 'assigned_employees' => 5, 'unassigned_employees' => 3])
        ->and($dashboard['trend_deltas'])->toMatchArray([
            'average_score_delta' => 10.0,
            'finalized_reviews_delta' => 0,
        ])
        ->and($dashboard['action_summary'])->toHaveKeys(['my_self_assessments_due', 'manager_reviews_due', 'approvals_due', 'overdue_assigned_to_me']);
});

test('dashboard statistics use calibrated scores and ratings when available', function () {
    Cache::flush();

    $dashboardUser = User::factory()->create();
    $dashboardUser->givePermissionTo(Permission::findOrCreate('performance.reports.view', 'web'));

    $cycle = ReviewCycle::factory()->create([
        'name' => '2026 Review',
        'code' => '2026',
        'status' => ReviewCycleStatus::Open,
        'start_date' => now()->subMonth(),
        'end_date' => now()->addMonth(),
    ]);

    $previousCycle = ReviewCycle::factory()->create([
        'name' => '2025 Review',
        'code' => '2025',
        'status' => ReviewCycleStatus::Closed,
        'end_date' => now()->subYear(),
    ]);

    $ratingScale = RatingScale::factory()->create(['applies_to' => RatingScaleType::Overall]);
    $preCalibrationRating = RatingScaleLevel::create([
        'rating_scale_id' => $ratingScale->id,
        'label' => 'Exceeds',
        'value' => 4,
        'sort_order' => 1,
    ]);
    $calibratedRating = RatingScaleLevel::create([
        'rating_scale_id' => $ratingScale->id,
        'label' => 'Meets',
        'value' => 3,
        'sort_order' => 2,
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->create([
        'status' => AppraisalStatus::Finalized,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2026 Review',
        'overall_score' => 92,
        'calibrated_overall_score' => 74,
        'overall_rating_scale_level_id' => $preCalibrationRating->id,
        'calibrated_overall_rating_scale_level_id' => $calibratedRating->id,
        'finalized_at' => now(),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->create([
        'status' => AppraisalStatus::Finalized,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2026 Review',
        'overall_score' => 86,
        'overall_rating_scale_level_id' => $preCalibrationRating->id,
        'finalized_at' => now(),
    ]);

    Appraisal::factory()->for($previousCycle, 'reviewCycle')->create([
        'status' => AppraisalStatus::Finalized,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2025 Review',
        'overall_score' => 70,
        'calibrated_overall_score' => 60,
        'overall_rating_scale_level_id' => $preCalibrationRating->id,
        'calibrated_overall_rating_scale_level_id' => $calibratedRating->id,
        'finalized_at' => now()->subYear(),
    ]);

    $dashboard = app(ReportQueryService::class)->dashboard($dashboardUser);

    expect($dashboard['rating_distribution'])->toContain([
        'rating' => 'Meets',
        'total' => 2,
    ])
        ->and($dashboard['rating_distribution'])->toContain([
            'rating' => 'Exceeds',
            'total' => 1,
        ])
        ->and($dashboard['cycle_performance'][0])->toMatchArray([
            'cycle' => '2025 Review',
            'average_score' => 60.0,
        ])
        ->and($dashboard['cycle_performance'][1])->toMatchArray([
            'cycle' => '2026 Review',
            'average_score' => 80.0,
        ])
        ->and($dashboard['department_performance'][0]['average_score'])->toBe(73.3)
        ->and($dashboard['department_risk'][0]['average_score'])->toBe(80.0)
        ->and($dashboard['score_quality'])->toMatchArray([
            'average_score' => 80.0,
            'median_score' => 80.0,
            'score_spread' => 12.0,
        ])
        ->and($dashboard['trend_deltas']['average_score_delta'])->toBe(20.0);
});
