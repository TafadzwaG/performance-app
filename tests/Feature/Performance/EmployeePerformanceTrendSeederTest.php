<?php

use App\Enums\PerformanceTrendStatus;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\EmployeePerformanceAnalyticsService;
use Database\Seeders\EmployeePerformanceTrendSeeder;
use Database\Seeders\PerformanceSetupSeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('employee performance trend seeder creates three cycle histories for three employees', function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
    $this->seed(PerformanceSetupSeeder::class);
    $this->seed(EmployeePerformanceTrendSeeder::class);

    $service = app(EmployeePerformanceAnalyticsService::class);

    $tatenda = User::query()->where('email', 'tatenda.dube@nhaka.test')->firstOrFail()->employeeProfile;
    $rumbidzai = User::query()->where('email', 'rumbidzai.ncube@nhaka.test')->firstOrFail()->employeeProfile;
    $farai = User::query()->where('email', 'farai.muchengeti@nhaka.test')->firstOrFail()->employeeProfile;

    $tatendaTrend = $service->employeeTrend($tatenda->id);
    $rumbidzaiTrend = $service->employeeTrend($rumbidzai->id);
    $faraiTrend = $service->employeeTrend($farai->id);

    expect($tatendaTrend['points'])->toHaveCount(3)
        ->and(collect($tatendaTrend['points'])->pluck('score')->all())->toBe([68.0, 74.0, 83.0])
        ->and($tatendaTrend['trend_status'])->toBe(PerformanceTrendStatus::Improving->value)
        ->and($rumbidzaiTrend['points'])->toHaveCount(3)
        ->and(collect($rumbidzaiTrend['points'])->pluck('score')->all())->toBe([86.0, 79.0, 72.0])
        ->and($rumbidzaiTrend['trend_status'])->toBe(PerformanceTrendStatus::Declining->value)
        ->and($faraiTrend['points'])->toHaveCount(3)
        ->and(collect($faraiTrend['points'])->pluck('score')->all())->toBe([76.0, 76.0, 76.0])
        ->and($faraiTrend['trend_status'])->toBe(PerformanceTrendStatus::Stable->value);
});

test('employee performance trend seeder supports peer comparison in the latest cycle', function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);
    $this->seed(PerformanceSetupSeeder::class);
    $this->seed(EmployeePerformanceTrendSeeder::class);

    $service = app(EmployeePerformanceAnalyticsService::class);
    $currentCycle = ReviewCycle::query()->where('code', 'FY2026-ANNUAL')->firstOrFail();
    $tatenda = User::query()->where('email', 'tatenda.dube@nhaka.test')->firstOrFail()->employeeProfile;

    $peerComparison = $service->peerComparison($tatenda->id, [
        'review_cycle_id' => $currentCycle->id,
    ]);

    expect($peerComparison)->not->toBeNull()
        ->and($peerComparison['cohort_size'])->toBeGreaterThanOrEqual(4)
        ->and(collect($peerComparison['peers'])->pluck('employee_name'))
        ->toContain('Chiedza Nyoni')
        ->toContain('Tinashe Bhebhe');
});
