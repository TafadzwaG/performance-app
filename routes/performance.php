<?php

use App\Http\Controllers\Performance\AppraisalApprovalController;
use App\Http\Controllers\Performance\AppraisalController;
use App\Http\Controllers\Performance\AppraisalEvidenceController;
use App\Http\Controllers\Performance\AppraisalFinalizeController;
use App\Http\Controllers\Performance\AppraisalManagerReviewController;
use App\Http\Controllers\Performance\AppraisalPlanController;
use App\Http\Controllers\Performance\AppraisalPrintController;
use App\Http\Controllers\Performance\AppraisalSelfAssessmentController;
use App\Http\Controllers\Performance\CycleAssignmentController;
use App\Http\Controllers\Performance\DashboardController;
use App\Http\Controllers\Performance\DevelopmentPlanController;
use App\Http\Controllers\Performance\EmployeeProfileController;
use App\Http\Controllers\Performance\ReportController;
use App\Http\Controllers\Performance\ReportExportController;
use App\Http\Controllers\Performance\ReviewCycleController;
use App\Http\Controllers\Performance\Setup\AppraisalTemplateController;
use App\Http\Controllers\Performance\Setup\CompetencyController;
use App\Http\Controllers\Performance\Setup\DepartmentController;
use App\Http\Controllers\Performance\Setup\GoalLibraryController;
use App\Http\Controllers\Performance\Setup\JobTitleController;
use App\Http\Controllers\Performance\Setup\PerspectiveController;
use App\Http\Controllers\Performance\Setup\RatingScaleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('performance')->as('performance.')->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('setup/departments', DepartmentController::class)
        ->parameters(['departments' => 'department'])
        ->names('setup.departments');

    Route::resource('setup/job-titles', JobTitleController::class)
        ->parameters(['job-titles' => 'job_title'])
        ->names('setup.job_titles');

    Route::resource('setup/perspectives', PerspectiveController::class)
        ->parameters(['perspectives' => 'perspective'])
        ->except('show')
        ->names('setup.perspectives');

    Route::resource('setup/competencies', CompetencyController::class)
        ->parameters(['competencies' => 'competency'])
        ->names('setup.competencies');

    Route::resource('setup/rating-scales', RatingScaleController::class)
        ->parameters(['rating-scales' => 'rating_scale'])
        ->names('setup.rating_scales');

    Route::resource('review-cycles', ReviewCycleController::class)
        ->parameters(['review-cycles' => 'review_cycle'])
        ->except('destroy')
        ->names('review_cycles');
    Route::post('review-cycles/{review_cycle}/open', [ReviewCycleController::class, 'open'])->name('review_cycles.open');
    Route::post('review-cycles/{review_cycle}/close', [ReviewCycleController::class, 'close'])->name('review_cycles.close');
    Route::get('review-cycles/{review_cycle}/assign-employees', [CycleAssignmentController::class, 'edit'])->name('review_cycles.assign');
    Route::post('review-cycles/{review_cycle}/assign-employees', [CycleAssignmentController::class, 'store'])->name('review_cycles.assign.store');

    Route::resource('templates', AppraisalTemplateController::class)
        ->parameters(['templates' => 'template'])
        ->names('templates');
    Route::get('templates/{template}/builder', [AppraisalTemplateController::class, 'builder'])->name('templates.builder');

    Route::resource('goal-library', GoalLibraryController::class)
        ->parameters(['goal-library' => 'goal_library_item'])
        ->names('goal_library');

    Route::resource('employees', EmployeeProfileController::class)
        ->parameters(['employees' => 'employee_profile'])
        ->only(['index', 'store', 'show', 'edit', 'update'])
        ->names('employees');

    Route::resource('appraisals', AppraisalController::class)
        ->parameters(['appraisals' => 'appraisal'])
        ->only(['index', 'create', 'store', 'show'])
        ->names('appraisals');
    Route::get('appraisals/{appraisal}/plan', [AppraisalPlanController::class, 'edit'])->name('appraisals.plan');
    Route::put('appraisals/{appraisal}/plan', [AppraisalPlanController::class, 'update'])->name('appraisals.plan.update');
    Route::post('appraisals/{appraisal}/plan/submit', [AppraisalPlanController::class, 'submit'])->name('appraisals.plan.submit');
    Route::get('appraisals/{appraisal}/self-assessment', [AppraisalSelfAssessmentController::class, 'edit'])->name('appraisals.self_assessment');
    Route::put('appraisals/{appraisal}/self-assessment', [AppraisalSelfAssessmentController::class, 'update'])->name('appraisals.self_assessment.update');
    Route::post('appraisals/{appraisal}/self-assessment/submit', [AppraisalSelfAssessmentController::class, 'submit'])->name('appraisals.self_assessment.submit');
    Route::get('appraisals/{appraisal}/manager-review', [AppraisalManagerReviewController::class, 'edit'])->name('appraisals.manager_review');
    Route::put('appraisals/{appraisal}/manager-review', [AppraisalManagerReviewController::class, 'update'])->name('appraisals.manager_review.update');
    Route::post('appraisals/{appraisal}/manager-review/submit', [AppraisalManagerReviewController::class, 'submit'])->name('appraisals.manager_review.submit');
    Route::post('appraisals/{appraisal}/manager-review/send-back', [AppraisalManagerReviewController::class, 'sendBack'])->name('appraisals.manager_review.send_back');
    Route::get('appraisals/{appraisal}/approval', [AppraisalApprovalController::class, 'edit'])->name('appraisals.approval');
    Route::post('appraisals/{appraisal}/approval', [AppraisalApprovalController::class, 'store'])->name('appraisals.approval.store');
    Route::get('appraisals/{appraisal}/finalize', [AppraisalFinalizeController::class, 'edit'])->name('appraisals.finalize');
    Route::post('appraisals/{appraisal}/finalize', [AppraisalFinalizeController::class, 'store'])->name('appraisals.finalize.store');
    Route::post('appraisals/{appraisal}/objectives/{objective}/evidence', [AppraisalEvidenceController::class, 'store'])->name('appraisals.evidence.store');
    Route::get('appraisals/{appraisal}/print', [AppraisalPrintController::class, 'show'])->name('appraisals.print');
    Route::get('appraisals/{appraisal}/print/pdf', [AppraisalPrintController::class, 'pdf'])->name('appraisals.print.pdf');

    Route::get('development-plans', [DevelopmentPlanController::class, 'index'])->name('development_plans.index');
    Route::get('development-plans/{appraisal}', [DevelopmentPlanController::class, 'show'])->name('development_plans.show');
    Route::get('development-plans/{appraisal}/edit', [DevelopmentPlanController::class, 'edit'])->name('development_plans.edit');
    Route::put('development-plans/{appraisal}', [DevelopmentPlanController::class, 'update'])->name('development_plans.update');

    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/cycle-summary', [ReportController::class, 'cycleSummary'])->name('reports.cycle_summary');
    Route::get('reports/department-summary', [ReportController::class, 'departmentSummary'])->name('reports.department_summary');
    Route::get('reports/employee-summary', [ReportController::class, 'employeeSummary'])->name('reports.employee_summary');
    Route::get('reports/completion-status', [ReportController::class, 'completionStatus'])->name('reports.completion_status');
    Route::get('reports/rating-distribution', [ReportController::class, 'ratingDistribution'])->name('reports.rating_distribution');
    Route::get('reports/overdue-reviews', [ReportController::class, 'overdueReviews'])->name('reports.overdue_reviews');
    Route::get('reports/{report}/export', [ReportExportController::class, 'export'])->name('reports.export');
});
