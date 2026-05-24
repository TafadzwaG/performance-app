<?php

use App\Enums\AppraisalStatus;
use App\Models\Appraisal;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createReportExportActor(array $permissions = ['performance.reports.export']): User
{
    $actor = User::factory()->create(['is_approved' => true]);

    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
        $actor->givePermissionTo($permission);
    }

    EmployeeProfile::factory()->for($actor)->create();

    return $actor;
}

test('authorized user can export performance reports to excel and pdf', function () {
    $actor = createReportExportActor();

    $cycle = ReviewCycle::factory()->create([
        'name' => '2026 Annual Review',
        'code' => 'FY26',
    ]);

    Appraisal::factory()->for($cycle, 'reviewCycle')->create([
        'status' => AppraisalStatus::Finalized,
        'cycle_name_snapshot' => '2026 Annual Review',
        'department_name_snapshot' => 'Sales',
        'overall_score' => 82,
        'finalized_at' => now(),
    ]);

    foreach (['cycle-summary', 'department-summary', 'employee-summary', 'completion-status', 'rating-distribution', 'overdue-reviews', 'employee-performance-movement'] as $report) {
        $this->actingAs($actor)
            ->get(route('performance.reports.export', [
                'report' => $report,
                'format' => 'xlsx',
                'review_cycle_id' => $cycle->id,
            ]))
            ->assertOk()
            ->assertDownload();

        $this->actingAs($actor)
            ->get(route('performance.reports.export', [
                'report' => $report,
                'format' => 'pdf',
                'review_cycle_id' => $cycle->id,
            ]))
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }
});

test('performance report export defaults to excel when format is omitted', function () {
    $actor = createReportExportActor();

    $this->actingAs($actor)
        ->get(route('performance.reports.export', ['report' => 'cycle-summary']))
        ->assertOk()
        ->assertDownload();
});

test('users without export permission cannot download performance reports', function () {
    $actor = createReportExportActor(['performance.reports.view']);

    $this->actingAs($actor)
        ->get(route('performance.reports.export', [
            'report' => 'cycle-summary',
            'format' => 'pdf',
        ]))
        ->assertForbidden();
});

test('performance report pdf uses the shared studio report template', function () {
    $view = file_get_contents(resource_path('views/pdf/performance/report-table.blade.php'));
    $layout = file_get_contents(resource_path('views/pdf/layouts/studio-export.blade.php'));

    expect($view)->toContain("@extends('pdf.layouts.studio-export')")
        ->and($layout)->toContain('studio-export-styles')
        ->and($view)->toContain('Export Filters')
        ->and($view)->toContain('$tableRows');
});
