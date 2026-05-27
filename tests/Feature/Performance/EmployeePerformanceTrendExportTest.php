<?php

use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\User;
use App\Services\Performance\EmployeePerformanceAnalyticsService;
use App\Services\Performance\Pdf\EmployeePerformanceTrendPdfService;
use App\Support\Performance\PerformanceTrendChartSvg;
use Database\Seeders\EmployeePerformanceTrendSeeder;
use Database\Seeders\PerformanceSetupSeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function seedPerformanceTrendDemo(): EmployeeProfile
{
    test()->seed(PermissionSeeder::class);
    test()->seed(RoleSeeder::class);
    test()->seed(PerformanceSetupSeeder::class);
    test()->seed(EmployeePerformanceTrendSeeder::class);

    return User::query()
        ->where('email', 'tatenda.dube@nhaka.test')
        ->firstOrFail()
        ->employeeProfile;
}

test('authorized user can export employee performance trend pdf from profile route', function () {
    $profile = seedPerformanceTrendDemo();

    $viewer = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.employees.view', 'web');
    $viewer->givePermissionTo('performance.employees.view');
    EmployeeProfile::factory()->for($viewer)->create();

    $this->actingAs($viewer)
        ->get(route('performance.employees.export.performance_trend.pdf', $profile))
        ->assertOk()
        ->assertDownload()
        ->assertHeader('content-type', 'application/pdf');
});

test('employee performance trend pdf download returns a valid pdf file', function () {
    $profile = seedPerformanceTrendDemo();
    $viewer = User::factory()->create(['is_approved' => true, 'name' => 'Export Viewer']);

    $response = app(EmployeePerformanceTrendPdfService::class)
        ->download($profile, $viewer);

    $tempPath = $response->getFile()->getPathname();

    expect(file_get_contents($tempPath))->toStartWith('%PDF');

    @unlink($tempPath);
});

test('employee performance trend pdf view renders chart and cycle table', function () {
    $profile = seedPerformanceTrendDemo();
    $profile->load(['user', 'department', 'jobTitle', 'lineManager']);

    $service = app(EmployeePerformanceAnalyticsService::class);
    $performanceTrend = $service->employeeTrend($profile->id);

    $html = view('pdf.performance.employee-performance-trend', [
        ...\App\Support\Branding::exportHeaderContext(),
        'employeeProfile' => $profile,
        'performanceTrend' => $performanceTrend,
        'peerComparison' => $service->peerComparison($profile->id),
        'chartSvg' => PerformanceTrendChartSvg::render($performanceTrend['points']),
        'exportedBy' => 'Export Viewer',
        'exportedByEmail' => 'viewer@example.com',
        'exportedAt' => now(),
        'headerReportLabel' => 'Employee Performance Trend',
        'trendStatusLabel' => 'Improving',
    ])->render();

    expect($html)->toContain('Employee Performance Trend')
        ->and($html)->toContain('Performance by Cycle')
        ->and($html)->toContain('<svg')
        ->and($html)->toContain('2024 Annual Performance Review')
        ->and($html)->toContain('83%');
});

test('employee performance trend export returns 422 when no finalized scores exist', function () {
    $viewer = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.employees.view', 'web');
    $viewer->givePermissionTo('performance.employees.view');
    EmployeeProfile::factory()->for($viewer)->create();

    $emptyProfile = EmployeeProfile::factory()->create();

    $this->actingAs($viewer)
        ->get(route('performance.employees.export.performance_trend.pdf', $emptyProfile))
        ->assertStatus(422);
});
