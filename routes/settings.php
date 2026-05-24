<?php

use App\Http\Controllers\BrandingController;
use App\Http\Controllers\Settings\DisasterRecoveryController;
use App\Http\Controllers\Settings\EmailMfaController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SystemOperationsController;
use App\Http\Controllers\Settings\SystemSettingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'approved', 'password.change'])->group(function () {
    Route::middleware('can:system.settings.manage')->group(function () {
        Route::get('settings', [SystemSettingsController::class, 'index'])->name('settings.index');
        Route::put('settings', [SystemSettingsController::class, 'update'])->name('settings.update');
        Route::post('settings/test-email', [SystemSettingsController::class, 'testEmail'])->name('settings.test_email');
        Route::post('settings/logo', [BrandingController::class, 'update'])->name('settings.logo.update');
        Route::delete('settings/logo', [BrandingController::class, 'destroy'])->name('settings.logo.destroy');
        Route::post('settings/operations/failed-jobs/{job}/retry', [SystemOperationsController::class, 'retryFailedJob'])->name('settings.operations.failed_jobs.retry');
        Route::delete('settings/operations/failed-jobs/{job}', [SystemOperationsController::class, 'forgetFailedJob'])->name('settings.operations.failed_jobs.forget');
        Route::delete('settings/operations/failed-jobs', [SystemOperationsController::class, 'flushFailedJobs'])->name('settings.operations.failed_jobs.flush');
        Route::delete('settings/operations/pending-jobs/{job}', [SystemOperationsController::class, 'deletePendingJob'])->name('settings.operations.pending_jobs.destroy');
    });

    Route::middleware('can:system.disaster_recovery.manage')->group(function () {
        Route::get('settings/disaster-recovery', [DisasterRecoveryController::class, 'index'])->name('settings.disaster_recovery.index');
        Route::post('settings/disaster-recovery/backups', [DisasterRecoveryController::class, 'storeBackup'])->name('settings.disaster_recovery.backups.store');
        Route::get('settings/disaster-recovery/backups/{backup}', [DisasterRecoveryController::class, 'showBackup'])->name('settings.disaster_recovery.backups.show');
        Route::post('settings/disaster-recovery/restores', [DisasterRecoveryController::class, 'storeRestore'])->name('settings.disaster_recovery.restores.store');
        Route::post('settings/disaster-recovery/restores/{restore}/approve', [DisasterRecoveryController::class, 'approveRestore'])->name('settings.disaster_recovery.restores.approve');
        Route::post('settings/disaster-recovery/restores/{restore}/reject', [DisasterRecoveryController::class, 'rejectRestore'])->name('settings.disaster_recovery.restores.reject');
        Route::get('settings/disaster-recovery/restore-tests', [DisasterRecoveryController::class, 'restoreTests'])->name('settings.disaster_recovery.restore_tests.index');
    });

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('settings/email-mfa', [EmailMfaController::class, 'enable'])->name('email-mfa.enable');
    Route::delete('settings/email-mfa', [EmailMfaController::class, 'disable'])->name('email-mfa.disable');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
});
