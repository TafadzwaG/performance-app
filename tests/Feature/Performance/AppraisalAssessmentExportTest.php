<?php

use App\Enums\AppraisalStatus;
use App\Enums\CommentType;
use App\Enums\RatingScaleType;
use App\Models\Appraisal;
use App\Models\AppraisalComment;
use App\Models\AppraisalObjective;
use App\Models\AppraisalTemplate;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\RatingScale;
use App\Models\RatingScaleLevel;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\Export\AppraisalExportService;
use App\Services\Performance\Pdf\AppraisalPdfService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('appraisal export excel follows the uploaded assessment form structure', function () {
    [$actor, $appraisal] = createAssessmentExportFixture();

    $response = app(AppraisalExportService::class)->excel($appraisal, $actor);
    $path = $response->getFile()->getPathname();

    expect($response->getFile()->getFilename())->toEndWith('.xlsx');

    $text = xlsxText($path);

    expect($text)->toContain('INDIVIDUAL PERFORMANCE ASSESSMENT FORM')
        ->and($text)->toContain('Employee Name')
        ->and($text)->toContain('Job Title')
        ->and($text)->toContain('Review Period')
        ->and($text)->toContain('Objective (The Goal)')
        ->and($text)->toContain('KPI / Measure (How Measured)')
        ->and($text)->toContain('Target (Success Definition)')
        ->and($text)->toContain('Evidence Source')
        ->and($text)->toContain('Performance Achieved')
        ->and($text)->toContain('Manager’s Rating')
        ->and($text)->toContain('Other substantial achievements')
        ->and($text)->toContain('BUSINESS OBJECTIVES RATING SCALE')
        ->and($text)->toContain('VALUES OBJECTIVES RATING SCALE')
        ->and($text)->toContain('This person has achieved the agreed objectives to the agreed performance standards')
        ->and($text)->toContain('role model for the way the Company');
});

test('appraisal pdf download services use the shared assessment form view', function () {
    [$actor, $appraisal] = createAssessmentExportFixture();

    $exportResponse = app(AppraisalExportService::class)->pdf($appraisal, $actor);
    $printResponse = app(AppraisalPdfService::class)->download($appraisal);

    expect($exportResponse->getFile()->getFilename())->toEndWith('.pdf')
        ->and($printResponse->getFile()->getFilename())->toEndWith('.pdf');

    $viewPath = resource_path('views/pdf/performance/appraisal-assessment-form.blade.php');
    $view = file_get_contents($viewPath);

    expect($view)->toContain('INDIVIDUAL PERFORMANCE ASSESSMENT FORM')
        ->and($view)->toContain('Objective (The Goal)')
        ->and($view)->toContain('KPI / Measure (How Measured)')
        ->and($view)->toContain('Target (Success Definition)')
        ->and($view)->toContain('Performance Achieved')
        ->and($view)->toContain('Manager&rsquo;s Rating')
        ->and($view)->toContain('BUSINESS OBJECTIVES RATING SCALE')
        ->and($view)->toContain('VALUES OBJECTIVES RATING SCALE')
        ->and($view)->toContain('$level->description');
});

test('appraisal export routes still download pdf and excel files', function () {
    [$actor, $appraisal] = createAssessmentExportFixture();

    $this->actingAs($actor)
        ->get(route('performance.appraisals.export.pdf', $appraisal))
        ->assertOk()
        ->assertDownload();

    $this->actingAs($actor)
        ->get(route('performance.appraisals.export.excel', $appraisal))
        ->assertOk()
        ->assertDownload();

    $this->actingAs($actor)
        ->get(route('performance.appraisals.print.pdf', $appraisal))
        ->assertOk()
        ->assertDownload();
});

function createAssessmentExportFixture(): array
{
    $actor = User::factory()->create(['is_approved' => true, 'name' => 'Export Actor']);
    Permission::findOrCreate('performance.appraisals.view_all', 'web');
    Permission::findOrCreate('performance.reports.print', 'web');
    $actor->givePermissionTo(['performance.appraisals.view_all', 'performance.reports.print']);

    $department = Department::factory()->create(['name' => 'Front Office']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Front Office Manager']);
    $profile = EmployeeProfile::factory()
        ->for($actor)
        ->for($department)
        ->for($jobTitle)
        ->create(['employee_number' => 'EMP-1001']);

    $objectiveScale = RatingScale::factory()->create([
        'name' => 'Objective 5 Point',
        'code' => 'objective-5-point',
        'applies_to' => RatingScaleType::Objective,
    ]);
    $valuesScale = RatingScale::factory()->create([
        'name' => 'Values Objectives',
        'code' => 'competency-values',
        'applies_to' => RatingScaleType::Competency,
    ]);
    $overallScale = RatingScale::factory()->create([
        'name' => 'Overall Performance',
        'code' => 'overall-performance',
        'applies_to' => RatingScaleType::Overall,
    ]);

    $objectiveLevel = RatingScaleLevel::create([
        'rating_scale_id' => $objectiveScale->id,
        'label' => 'Good performance',
        'description' => 'This person has achieved the agreed objectives to the agreed performance standards.',
        'short_label' => '3',
        'value' => 3,
        'sort_order' => 3,
    ]);
    RatingScaleLevel::create([
        'rating_scale_id' => $valuesScale->id,
        'label' => 'Role models the values',
        'description' => "This person is a role model for the way the Company's employees should behave.",
        'short_label' => 'A',
        'value' => 4,
        'sort_order' => 1,
    ]);
    RatingScaleLevel::create([
        'rating_scale_id' => $overallScale->id,
        'label' => 'Good performance',
        'short_label' => '3',
        'value' => 3,
        'min_percent' => 80,
        'max_percent' => 90,
        'sort_order' => 3,
    ]);

    $template = AppraisalTemplate::factory()->create([
        'name' => 'Monomotapa Performance Appraisal Template',
        'code' => 'monomotapa-performance-appraisal',
        'objective_rating_scale_id' => $objectiveScale->id,
        'competency_rating_scale_id' => $valuesScale->id,
        'overall_rating_scale_id' => $overallScale->id,
    ]);

    $cycle = ReviewCycle::factory()->create([
        'name' => '2026 Annual Review',
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
    ]);

    $appraisal = Appraisal::factory()
        ->for($cycle, 'reviewCycle')
        ->for($profile, 'employeeProfile')
        ->for($template, 'template')
        ->create([
            'employee_user_id' => $actor->id,
            'status' => AppraisalStatus::ManagerReviewPending,
            'employee_name_snapshot' => 'T. Ndlovu',
            'employee_number_snapshot' => 'EMP-1001',
            'department_name_snapshot' => 'Front Office',
            'job_title_name_snapshot' => 'Front Office Manager',
            'cycle_name_snapshot' => '2026 Annual Review',
            'template_name_snapshot' => 'Monomotapa Performance Appraisal Template',
        ]);

    $perspective = Perspective::factory()->create(['name' => 'Financial']);
    AppraisalObjective::factory()->for($appraisal)->for($perspective)->create([
        'title' => 'Maximize room revenue',
        'kpi_measure' => 'Average Daily Rate',
        'target_definition' => 'Achieve ADR of 150',
        'weight' => 20,
        'evidence_source' => 'PMS Report',
        'performance_achieved' => 'ADR reached 152',
        'self_rating_scale_level_id' => $objectiveLevel->id,
        'manager_rating_scale_level_id' => $objectiveLevel->id,
        'sort_order' => 1,
    ]);

    AppraisalComment::create([
        'appraisal_id' => $appraisal->id,
        'author_user_id' => $actor->id,
        'comment_type' => CommentType::AchievementNote,
        'body' => 'Delivered strong revenue growth.',
    ]);
    AppraisalComment::create([
        'appraisal_id' => $appraisal->id,
        'author_user_id' => $actor->id,
        'comment_type' => CommentType::SignificantIssue,
        'body' => 'Renovations affected room inventory.',
    ]);

    return [$actor, $appraisal];
}

function xlsxText(string $path): string
{
    $zip = new ZipArchive;
    $zip->open($path);

    $text = '';
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = $zip->getNameIndex($i);
        if (str_ends_with($name, '.xml')) {
            $text .= $zip->getFromIndex($i);
        }
    }

    $zip->close();

    return html_entity_decode(strip_tags($text));
}
