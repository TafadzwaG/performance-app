<?php

use App\Http\Controllers\Performance\AppraisalApprovalController;
use App\Http\Controllers\Performance\AppraisalCalibrationController;
use App\Http\Controllers\Performance\AppraisalCalibrationEvidenceController;
use App\Http\Controllers\Performance\AppraisalController;
use App\Http\Controllers\Performance\AppraisalEvidenceController;
use App\Http\Controllers\Performance\AppraisalExportController;
use App\Http\Controllers\Performance\AppraisalFinalizeController;
use App\Http\Controllers\Performance\AppraisalLookupController;
use App\Http\Controllers\Performance\AppraisalManagerReviewController;
use App\Http\Controllers\Performance\AppraisalPlanController;
use App\Http\Controllers\Performance\AppraisalPrintController;
use App\Http\Controllers\Performance\AppraisalSelfAssessmentController;
use App\Http\Controllers\Performance\AppraisalTemplateExportController;
use App\Http\Controllers\Performance\AppraisalTemplatePrintController;
use App\Http\Controllers\Performance\CycleAssignmentController;
use App\Http\Controllers\Performance\DashboardController;
use App\Http\Controllers\Performance\DashboardGoalsController;
use App\Http\Controllers\Performance\DevelopmentPlanController;
use App\Http\Controllers\Performance\EmployeeFieldSettingsController;
use App\Http\Controllers\Performance\EmployeeProfileController;
use App\Http\Controllers\Performance\MyEmployeeProfileController;
use App\Http\Controllers\Performance\MyKpisController;
use App\Http\Controllers\Performance\ReportController;
use App\Http\Controllers\Performance\ReportExportController;
use App\Http\Controllers\Performance\ReviewCycleController;
use App\Http\Controllers\Performance\Setup\AppraisalTemplateController;
use App\Http\Controllers\Performance\Setup\AppraisalTemplateSharedController;
use App\Http\Controllers\Performance\Setup\CompetencyController;
use App\Http\Controllers\Performance\Setup\DepartmentController;
use App\Http\Controllers\Performance\Setup\GoalLibraryController;
use App\Http\Controllers\Performance\Setup\JobTitleController;
use App\Http\Controllers\Performance\Setup\LocationController;
use App\Http\Controllers\Performance\Setup\PerspectiveController;
use App\Http\Controllers\Performance\Setup\RatingScaleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'tenant', 'approved', 'password.change', 'employee.profile.complete'])->prefix('performance')->as('performance.')->group(function () {
    Route::get('dashboard', DashboardController::class)
        ->name('dashboard');
    Route::get('dashboard/goals/lookup', [DashboardGoalsController::class, 'lookup'])
        ->name('dashboard.goals.lookup');
    Route::get('dashboard/goals/{appraisal}', [DashboardGoalsController::class, 'show'])
        ->name('dashboard.goals.show');

    Route::get('profile', [MyEmployeeProfileController::class, 'show'])->name('profile.show');
    Route::get('profile/edit', [MyEmployeeProfileController::class, 'edit'])->name('profile.edit');
    Route::put('profile', [MyEmployeeProfileController::class, 'update'])->name('profile.update');

    Route::get('profile/export/performance-trend/pdf', [MyEmployeeProfileController::class, 'exportPerformanceTrendPdf'])
        ->name('profile.export.performance_trend.pdf');

    Route::get('my-kpis', [MyKpisController::class, 'index'])->name('my_kpis.index');
    Route::get('my-kpis/create', [MyKpisController::class, 'create'])->name('my_kpis.create');
    Route::post('my-kpis', [MyKpisController::class, 'store'])->name('my_kpis.store');
    Route::get('my-kpis/{goal_library_item}/edit', [MyKpisController::class, 'edit'])->name('my_kpis.edit');
    Route::put('my-kpis/{goal_library_item}', [MyKpisController::class, 'update'])->name('my_kpis.update');

    Route::resource('setup/departments', DepartmentController::class)
        ->parameters(['departments' => 'department'])
        ->names('setup.departments');

    Route::resource('setup/locations', LocationController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('setup.locations');

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
        ->names('review_cycles');
    Route::post('review-cycles/{review_cycle}/open', [ReviewCycleController::class, 'open'])->name('review_cycles.open');
    Route::get('review-cycles/{review_cycle}/automation-readiness', [ReviewCycleController::class, 'readiness'])->name('review_cycles.automation_readiness');
    Route::post('review-cycles/{review_cycle}/sync-eligible-employees', [ReviewCycleController::class, 'sync'])->name('review_cycles.sync_eligible');
    Route::post('review-cycles/{review_cycle}/close', [ReviewCycleController::class, 'close'])->name('review_cycles.close');
    Route::get('review-cycles/{review_cycle}/assign-employees', [CycleAssignmentController::class, 'edit'])->name('review_cycles.assign');
    Route::get('review-cycles/{review_cycle}/assign-employees/options', [CycleAssignmentController::class, 'employeeOptions'])->name('review_cycles.assign.employee_options');
    Route::post('review-cycles/{review_cycle}/assign-employees', [CycleAssignmentController::class, 'store'])->name('review_cycles.assign.store');
    Route::delete('review-cycles/{review_cycle}/assign-employees/{appraisal}', [CycleAssignmentController::class, 'destroy'])->name('review_cycles.assign.destroy');

    // Branded PDF / XLSX exports for an appraisal template.
    Route::get('templates/{template}/export/pdf', [AppraisalTemplateExportController::class, 'pdf'])->name('templates.export.pdf');
    Route::get('templates/{template}/export/excel', [AppraisalTemplateExportController::class, 'excel'])->name('templates.export.excel');
    Route::get('templates/{template}/print', [AppraisalTemplatePrintController::class, 'show'])->name('templates.print');
    Route::get('templates/{template}/print/pdf/inline', [AppraisalTemplatePrintController::class, 'inline'])->name('templates.print.pdf.inline');
    Route::get('templates/{template}/preview/layout', [AppraisalTemplatePrintController::class, 'layout'])->name('templates.preview.layout');

    Route::get('templates/shared/{organization}/{template}', [AppraisalTemplateSharedController::class, 'show'])
        ->name('templates.shared.show');
    Route::post('templates/shared/{organization}/{template}/import', [AppraisalTemplateSharedController::class, 'import'])
        ->name('templates.shared.import');

    Route::resource('templates', AppraisalTemplateController::class)
        ->parameters(['templates' => 'template'])
        ->names('templates');
    Route::get('templates/{template}/builder', [AppraisalTemplateController::class, 'builder'])->name('templates.builder');

    Route::get('goal-library/upload', [GoalLibraryController::class, 'uploadCreate'])->name('goal_library.upload');
    Route::post('goal-library/upload/preview', [GoalLibraryController::class, 'uploadPreview'])->name('goal_library.upload.preview');
    Route::post('goal-library/upload', [GoalLibraryController::class, 'uploadStore'])->name('goal_library.upload.store');
    Route::get('goal-library/upload/template', [GoalLibraryController::class, 'downloadUploadTemplate'])->name('goal_library.upload.template');
    Route::get('goal-library/export', [GoalLibraryController::class, 'export'])->name('goal_library.export');
    Route::patch('goal-library/{goal_library_item}/weight', [GoalLibraryController::class, 'updateWeight'])->name('goal_library.update_weight');
    Route::patch('goal-library/{goal_library_item}/quick', [GoalLibraryController::class, 'quickUpdate'])->name('goal_library.quick_update');
    Route::patch('goal-library/{goal_library_item}/deactivate', [GoalLibraryController::class, 'deactivate'])->name('goal_library.deactivate');
    Route::resource('goal-library', GoalLibraryController::class)
        ->parameters(['goal-library' => 'goal_library_item'])
        ->names('goal_library');

    Route::get('employees/{employee_profile}/export/performance-trend/pdf', [EmployeeProfileController::class, 'exportPerformanceTrendPdf'])
        ->name('employees.export.performance_trend.pdf');
    Route::get('employees/export', [EmployeeProfileController::class, 'export'])->name('employees.export');
    Route::get('employees/upload', [EmployeeProfileController::class, 'uploadCreate'])->name('employees.upload');
    Route::post('employees/upload/preview', [EmployeeProfileController::class, 'uploadPreview'])->name('employees.upload.preview');
    Route::post('employees/upload', [EmployeeProfileController::class, 'uploadStore'])->name('employees.upload.store');
    Route::get('employees/upload/template', [EmployeeProfileController::class, 'downloadUploadTemplate'])->name('employees.upload.template');
    Route::get('employees/{employee_profile}/deletion-impact', [EmployeeProfileController::class, 'deletionImpact'])
        ->name('employees.deletion_impact');
    Route::resource('employees', EmployeeProfileController::class)
        ->parameters(['employees' => 'employee_profile'])
        ->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'])
        ->names('employees');
    Route::patch('employees/{employee_profile}/line-manager', [EmployeeProfileController::class, 'updateLineManager'])
        ->name('employees.line_manager.update');
    Route::get('setup/employee-fields', [EmployeeFieldSettingsController::class, 'edit'])->name('setup.employee_fields.edit');
    Route::put('setup/employee-fields', [EmployeeFieldSettingsController::class, 'update'])->name('setup.employee_fields.update');

    // Async lookup endpoints for the create / bulk-assign screens.
    Route::get('appraisals/lookup/employees', [AppraisalLookupController::class, 'employees'])->name('appraisals.lookup.employees');
    Route::get('appraisals/lookup/cycles', [AppraisalLookupController::class, 'cycles'])->name('appraisals.lookup.cycles');
    Route::get('appraisals/lookup/templates', [AppraisalLookupController::class, 'templates'])->name('appraisals.lookup.templates');
    Route::get('appraisals/lookup/employees/{employee_profile}', [AppraisalLookupController::class, 'employeeDetail'])->name('appraisals.lookup.employee_detail');

    // Bulk-assign one cycle + template to many employees.
    Route::post('appraisals/bulk', [AppraisalController::class, 'bulkStore'])->name('appraisals.bulk_store');

    Route::resource('appraisals', AppraisalController::class)
        ->parameters(['appraisals' => 'appraisal'])
        ->only(['index', 'create', 'store', 'show', 'destroy'])
        ->names('appraisals');
    Route::get('appraisals/{appraisal}/step-wizard', [AppraisalController::class, 'stepWizard'])->name('appraisals.step_wizard');
    Route::get('appraisals/{appraisal}/plan', [AppraisalPlanController::class, 'edit'])->name('appraisals.plan');
    Route::get('appraisals/{appraisal}/plan/goal-library', [AppraisalPlanController::class, 'goalLibrary'])->name('appraisals.plan.goal_library');
    Route::put('appraisals/{appraisal}/plan', [AppraisalPlanController::class, 'update'])->name('appraisals.plan.update');
    Route::post('appraisals/{appraisal}/plan/submit', [AppraisalPlanController::class, 'submit'])->name('appraisals.plan.submit');
    Route::get('appraisals/{appraisal}/self-assessment', [AppraisalSelfAssessmentController::class, 'edit'])->name('appraisals.self_assessment');
    Route::put('appraisals/{appraisal}/self-assessment', [AppraisalSelfAssessmentController::class, 'update'])->name('appraisals.self_assessment.update');
    Route::post('appraisals/{appraisal}/self-assessment/submit', [AppraisalSelfAssessmentController::class, 'submit'])->name('appraisals.self_assessment.submit');
    Route::get('appraisals/{appraisal}/manager-review', [AppraisalManagerReviewController::class, 'edit'])->name('appraisals.manager_review');
    Route::put('appraisals/{appraisal}/manager-review', [AppraisalManagerReviewController::class, 'update'])->name('appraisals.manager_review.update');
    Route::post('appraisals/{appraisal}/manager-review/submit', [AppraisalManagerReviewController::class, 'submit'])->name('appraisals.manager_review.submit');
    Route::post('appraisals/{appraisal}/manager-review/recalculate-score', [AppraisalManagerReviewController::class, 'recalculateScore'])->name('appraisals.manager_review.recalculate_score');
    Route::post('appraisals/{appraisal}/manager-review/send-back', [AppraisalManagerReviewController::class, 'sendBack'])->name('appraisals.manager_review.send_back');
    Route::get('appraisals/{appraisal}/approval', [AppraisalApprovalController::class, 'edit'])->name('appraisals.approval');
    Route::post('appraisals/{appraisal}/approval', [AppraisalApprovalController::class, 'store'])->name('appraisals.approval.store');
    Route::get('appraisals/{appraisal}/calibration', [AppraisalCalibrationController::class, 'edit'])->name('appraisals.calibration');
    Route::post('appraisals/{appraisal}/calibration', [AppraisalCalibrationController::class, 'store'])->name('appraisals.calibration.store');
    Route::get('appraisals/{appraisal}/calibrations/{calibration}/evidence/{evidence}/download', [AppraisalCalibrationEvidenceController::class, 'download'])
        ->name('appraisals.calibration.evidence.download');
    Route::get('appraisals/{appraisal}/finalize', [AppraisalFinalizeController::class, 'edit'])->name('appraisals.finalize');
    Route::post('appraisals/{appraisal}/finalize', [AppraisalFinalizeController::class, 'store'])->name('appraisals.finalize.store');
    Route::post('appraisals/{appraisal}/objectives/{objective}/evidence', [AppraisalEvidenceController::class, 'store'])->name('appraisals.evidence.store');
    Route::get('appraisals/{appraisal}/objectives/{objective}/evidence/{evidence}/download', [AppraisalEvidenceController::class, 'download'])->name('appraisals.evidence.download');
    Route::get('appraisals/{appraisal}/print', [AppraisalPrintController::class, 'show'])->name('appraisals.print');
    Route::get('appraisals/{appraisal}/print/pdf', [AppraisalPrintController::class, 'pdf'])->name('appraisals.print.pdf');
    Route::get('appraisals/{appraisal}/print/pdf/inline', [AppraisalPrintController::class, 'inline'])->name('appraisals.print.pdf.inline');

    // Stage-agnostic export endpoints — branded PDF & XLSX.
    Route::get('appraisals/{appraisal}/export/pdf', [AppraisalExportController::class, 'pdf'])->name('appraisals.export.pdf');
    Route::get('appraisals/{appraisal}/export/excel', [AppraisalExportController::class, 'excel'])->name('appraisals.export.excel');

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
