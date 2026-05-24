<?php

use App\Enums\AppraisalStatus;
use App\Enums\PerformanceTrendStatus;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\EmployeePerformanceAnalyticsService;
use App\Services\Performance\ReportQueryService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createMovementScenario(): array
{
    $templateA = AppraisalTemplate::factory()->create(['name' => 'Leadership Scorecard']);
    $templateB = AppraisalTemplate::factory()->create(['name' => 'Operations Scorecard']);
    $department = Department::factory()->create(['name' => 'Sales']);

    $improvingUser = User::factory()->create(['name' => 'Improving Employee']);
    $decliningUser = User::factory()->create(['name' => 'Declining Employee']);
    $stableUser = User::factory()->create(['name' => 'Stable Employee']);
    $insufficientUser = User::factory()->create(['name' => 'Insufficient Employee']);
    $peerUser = User::factory()->create(['name' => 'Peer Employee']);

    $improvingProfile = EmployeeProfile::factory()->for($improvingUser)->for($department)->create();
    $decliningProfile = EmployeeProfile::factory()->for($decliningUser)->for($department)->create();
    $stableProfile = EmployeeProfile::factory()->for($stableUser)->for($department)->create();
    $insufficientProfile = EmployeeProfile::factory()->for($insufficientUser)->for($department)->create();
    $peerProfile = EmployeeProfile::factory()->for($peerUser)->for($department)->create();

    $previousCycle = ReviewCycle::factory()->create([
        'name' => '2025 Annual Review',
        'code' => 'FY25',
        'end_date' => now()->subYear(),
    ]);

    $currentCycle = ReviewCycle::factory()->create([
        'name' => '2026 Annual Review',
        'code' => 'FY26',
        'end_date' => now()->subMonth(),
    ]);

    $createFinalized = function (
        EmployeeProfile $profile,
        ReviewCycle $cycle,
        AppraisalTemplate $template,
        float $overallScore,
        ?float $calibratedScore = null,
    ): Appraisal {
        return Appraisal::factory()->for($cycle, 'reviewCycle')->for($profile, 'employeeProfile')->create([
            'template_id' => $template->id,
            'template_name_snapshot' => $template->name,
            'status' => AppraisalStatus::Finalized,
            'overall_score' => $overallScore,
            'calibrated_overall_score' => $calibratedScore,
            'cycle_name_snapshot' => $cycle->name,
            'finalized_at' => $cycle->end_date,
        ]);
    };

    $createFinalized($improvingProfile, $previousCycle, $templateA, 70);
    $createFinalized($improvingProfile, $currentCycle, $templateA, 65, 82);

    $createFinalized($decliningProfile, $previousCycle, $templateA, 88);
    $createFinalized($decliningProfile, $currentCycle, $templateA, 75);

    $createFinalized($stableProfile, $previousCycle, $templateA, 76);
    $createFinalized($stableProfile, $currentCycle, $templateA, 76);

    $createFinalized($insufficientProfile, $currentCycle, $templateA, 71);

    $createFinalized($peerProfile, $currentCycle, $templateA, 78);
    Appraisal::factory()->for($currentCycle, 'reviewCycle')->for(
        EmployeeProfile::factory()->for(User::factory())->for($department),
        'employeeProfile',
    )->create([
        'template_id' => $templateB->id,
        'template_name_snapshot' => $templateB->name,
        'status' => AppraisalStatus::Finalized,
        'overall_score' => 90,
        'finalized_at' => now(),
    ]);

    return compact(
        'templateA',
        'templateB',
        'department',
        'improvingProfile',
        'decliningProfile',
        'stableProfile',
        'insufficientProfile',
        'peerProfile',
        'previousCycle',
        'currentCycle',
    );
}

test('employee performance analytics uses calibrated scores before original scores', function () {
    $scenario = createMovementScenario();
    $service = app(EmployeePerformanceAnalyticsService::class);

    $trend = $service->employeeTrend($scenario['improvingProfile']->id, [
        'review_cycle_id' => $scenario['currentCycle']->id,
    ]);

    expect($trend['latest_score'])->toBe(82.0)
        ->and($trend['previous_score'])->toBe(70.0)
        ->and($trend['score_delta'])->toBe(12.0)
        ->and($trend['trend_status'])->toBe(PerformanceTrendStatus::Improving->value);
});

test('employee performance analytics calculates improving declining stable and insufficient statuses', function () {
    $scenario = createMovementScenario();
    $service = app(EmployeePerformanceAnalyticsService::class);

    $rows = $service->movementRows(['review_cycle_id' => $scenario['currentCycle']->id])
        ->keyBy('employee_profile_id');

    expect($rows[$scenario['improvingProfile']->id]['trend_status'])->toBe(PerformanceTrendStatus::Improving->value)
        ->and($rows[$scenario['decliningProfile']->id]['trend_status'])->toBe(PerformanceTrendStatus::Declining->value)
        ->and($rows[$scenario['stableProfile']->id]['trend_status'])->toBe(PerformanceTrendStatus::Stable->value)
        ->and($rows[$scenario['insufficientProfile']->id]['trend_status'])->toBe(PerformanceTrendStatus::InsufficientData->value);
});

test('peer comparison only includes employees on the same scorecard template', function () {
    $scenario = createMovementScenario();
    $service = app(EmployeePerformanceAnalyticsService::class);

    $peerComparison = $service->peerComparison($scenario['improvingProfile']->id, [
        'review_cycle_id' => $scenario['currentCycle']->id,
    ]);

    expect($peerComparison)->not->toBeNull()
        ->and($peerComparison['template_id'])->toBe($scenario['templateA']->id)
        ->and($peerComparison['peers'])->toHaveCount(4)
        ->and(collect($peerComparison['peers'])->pluck('employee_profile_id'))
        ->toContain($scenario['peerProfile']->id)
        ->not->toContain($scenario['improvingProfile']->id);
});

test('comprehensive reports include employee performance movement sections', function () {
    $scenario = createMovementScenario();
    $service = app(ReportQueryService::class);

    $reports = $service->comprehensiveReports(['review_cycle_id' => $scenario['currentCycle']->id]);

    expect($reports)->toHaveKey('employee_performance_movement')
        ->and($reports['employee_performance_movement']['summary']['improving'])->toBeGreaterThanOrEqual(1)
        ->and($reports['employee_performance_movement']['summary']['declining'])->toBeGreaterThanOrEqual(1)
        ->and($reports['employee_performance_movement']['summary']['stable'])->toBeGreaterThanOrEqual(1)
        ->and($reports['employee_performance_movement']['summary']['insufficient_data'])->toBeGreaterThanOrEqual(1)
        ->and($reports['employee_performance_movement']['scorecard_comparison'])->not->toBeEmpty();
});

test('employee show page receives performance trend and peer comparison props', function () {
    $scenario = createMovementScenario();

    $viewer = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.employees.view', 'web');
    $viewer->givePermissionTo('performance.employees.view');
    EmployeeProfile::factory()->for($viewer)->create();

    $this->actingAs($viewer)
        ->get(route('performance.employees.show', $scenario['improvingProfile']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('performance/employees/Show')
            ->has('performanceTrend.points')
            ->has('performanceTrend.trend_status')
            ->where('performanceTrend.trend_status', PerformanceTrendStatus::Improving->value)
            ->has('peerComparison.peers'));
});
