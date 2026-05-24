<?php

use App\Http\Controllers\IssueReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'approved', 'password.change', 'employee.profile.complete'])
    ->group(function () {
        Route::get('issues', [IssueReportController::class, 'index'])->name('issues.index');
        Route::get('issues/create', [IssueReportController::class, 'create'])->name('issues.create');
        Route::post('issues', [IssueReportController::class, 'store'])->name('issues.store');
        Route::get('issues/{issue}', [IssueReportController::class, 'show'])->name('issues.show');
        Route::get('issues/{issue}/edit', [IssueReportController::class, 'edit'])->name('issues.edit');
        Route::put('issues/{issue}', [IssueReportController::class, 'update'])->name('issues.update');
        Route::post('issues/{issue}/assign', [IssueReportController::class, 'assign'])->name('issues.assign');
        Route::post('issues/{issue}/status', [IssueReportController::class, 'updateStatus'])->name('issues.status');
    });
