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

test('comprehensive reports expose specific operational report sections', function () {
    Cache::flush();

    $reportUser = User::factory()->create(['name' => 'Report User']);
    $reportUser->givePermissionTo(Permission::findOrCreate('performance.reports.view', 'web'));

    $manager = User::factory()->create(['name' => 'Line Manager']);
    $approver = User::factory()->create(['name' => 'Approver']);
    $sales = Department::factory()->create(['name' => 'Sales']);
    $operations = Department::factory()->create(['name' => 'Operations']);

    EmployeeProfile::factory()->for($reportUser)->for($sales)->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
    ]);

    $cycle = ReviewCycle::factory()->create([
        'name' => '2026 Annual Review',
        'code' => 'FY26',
        'status' => ReviewCycleStatus::Open,
        'start_date' => now()->subMonths(2),
        'end_date' => now()->addMonth(),
        'self_assessment_deadline' => now()->subDays(3),
        'manager_review_deadline' => now()->subDays(8),
        'approval_deadline' => now()->addDays(5),
    ]);

    $previousCycle = ReviewCycle::factory()->create([
        'name' => '2025 Annual Review',
        'code' => 'FY25',
        'status' => ReviewCycleStatus::Closed,
        'end_date' => now()->subYear(),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($sales), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::Finalized,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2026 Annual Review',
        'business_score' => 82,
        'values_score' => 74,
        'overall_score' => 80,
        'finalized_at' => now(),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($sales), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::ManagerReviewPending,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2026 Annual Review',
        'self_assessment_submitted_at' => now()->subDays(9),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($operations), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::SelfAssessmentPending,
        'department_name_snapshot' => 'Operations',
        'cycle_name_snapshot' => '2026 Annual Review',
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($operations), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::SentBack,
        'department_name_snapshot' => 'Operations',
        'cycle_name_snapshot' => '2026 Annual Review',
    ]);

    Appraisal::factory()->for($previousCycle, 'reviewCycle')->for(EmployeeProfile::factory()->for(User::factory())->for($sales), 'employeeProfile')->create([
        'line_manager_user_id' => $manager->id,
        'approving_manager_user_id' => $approver->id,
        'status' => AppraisalStatus::Finalized,
        'department_name_snapshot' => 'Sales',
        'cycle_name_snapshot' => '2025 Annual Review',
        'overall_score' => 70,
        'finalized_at' => now()->subYear(),
    ]);

    $reports = app(ReportQueryService::class)->comprehensiveReports(['review_cycle_id' => $cycle->id]);

    expect($reports)->toHaveKeys([
        'executive_summary',
        'workflow_pipeline',
        'department_breakdown',
        'manager_accountability',
        'employee_exception_report',
        'rating_quality',
        'overdue_analysis',
        'cycle_comparison',
    ])
        ->and($reports['executive_summary'])->toMatchArray([
            'total_appraisals' => 4,
            'finalized_reviews' => 1,
            'completion_rate' => 25.0,
            'sent_back_count' => 1,
        ])
        ->and($reports['workflow_pipeline'])->toContain([
            'status' => 'manager_review_pending',
            'label' => 'Manager Review Pending',
            'total' => 1,
            'share' => 25.0,
        ])
        ->and($reports['department_breakdown'][0])->toHaveKeys([
            'department',
            'total',
            'completion_rate',
            'average_score',
            'overdue_count',
            'sent_back_count',
            'risk_level',
        ])
        ->and($reports['manager_accountability'][0])->toMatchArray([
            'manager' => 'Line Manager',
            'assigned_reviews' => 4,
            'pending_manager_reviews' => 1,
            'overdue_reviews' => 2,
        ])
        ->and($reports['employee_exception_report'])->toHaveCount(3)
        ->and($reports['rating_quality'])->toMatchArray([
            'average_score' => 80.0,
            'median_score' => 80.0,
            'business_values_gap' => 8.0,
        ])
        ->and($reports['overdue_analysis']['oldest_days_overdue'])->toBeGreaterThanOrEqual(8)
        ->and($reports['cycle_comparison'])->toMatchArray([
            'previous_cycle' => '2025 Annual Review',
            'average_score_delta' => 10.0,
        ]);
});

test('reports use calibrated scores and ratings when available', function () {
    Cache::flush();

    $cycle = ReviewCycle::factory()->create([
        'name' => '2026 Annual Review',
        'code' => 'FY26',
        'status' => ReviewCycleStatus::Closed,
        'end_date' => now(),
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
        'employee_name_snapshot' => 'Calibrated Employee',
        'employee_number_snapshot' => 'EMP-001',
        'cycle_name_snapshot' => '2026 Annual Review',
        'department_name_snapshot' => 'Sales',
        'overall_score' => 92,
        'calibrated_overall_score' => 74,
        'overall_rating_scale_level_id' => $preCalibrationRating->id,
        'calibrated_overall_rating_scale_level_id' => $calibratedRating->id,
        'finalized_at' => now(),
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->create([
        'status' => AppraisalStatus::Finalized,
        'employee_name_snapshot' => 'Uncalibrated Employee',
        'employee_number_snapshot' => 'EMP-002',
        'cycle_name_snapshot' => '2026 Annual Review',
        'department_name_snapshot' => 'Sales',
        'overall_score' => 86,
        'overall_rating_scale_level_id' => $preCalibrationRating->id,
        'finalized_at' => now(),
    ]);

    $service = app(ReportQueryService::class);

    $reports = $service->comprehensiveReports(['review_cycle_id' => $cycle->id]);
    $employeeSummary = $service->employeeSummary(['review_cycle_id' => $cycle->id])->keyBy('employee_number_snapshot');
    $ratingDistribution = $service->ratingDistribution(['review_cycle_id' => $cycle->id])->pluck('total', 'rating');
    $cycleSummary = $service->cycleSummary(['review_cycle_id' => $cycle->id])->first();
    $departmentSummary = $service->departmentSummary(['review_cycle_id' => $cycle->id])->first();

    expect($reports['executive_summary']['average_score'])->toBe(80.0)
        ->and($reports['rating_quality'])->toMatchArray([
            'average_score' => 80.0,
            'median_score' => 80.0,
            'highest_score' => 86.0,
            'lowest_score' => 74.0,
            'score_spread' => 12.0,
        ])
        ->and($reports['department_breakdown'][0]['average_score'])->toBe(80.0)
        ->and((float) $employeeSummary->get('EMP-001')->effective_overall_score)->toBe(74.0)
        ->and((float) $employeeSummary->get('EMP-002')->effective_overall_score)->toBe(86.0)
        ->and((int) $ratingDistribution->get('Meets'))->toBe(1)
        ->and((int) $ratingDistribution->get('Exceeds'))->toBe(1)
        ->and(round((float) $cycleSummary->average_score, 1))->toBe(80.0)
        ->and(round((float) $departmentSummary->average_score, 1))->toBe(80.0);
});
