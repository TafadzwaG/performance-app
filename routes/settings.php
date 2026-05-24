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
    Route::get('settings', [SystemSettingsController::class, 'index'])->name('settings.index');

    Route::middleware('can:system.settings.manage')->group(function () {
        Route::put('settings', [SystemSettingsController::class, 'update'])->name('settings.update');
        Route::post('settings/test-email', [SystemSettingsController::class, 'testEmail'])->name('settings.test_email');
        Route::post('settings/logo', [BrandingController::class, 'update'])->name('settings.logo.update');
        Route::delete('settings/logo', [BrandingController::class, 'destroy'])->name('settings.logo.destroy');
        Route::post('settings/operations/failed-jobs/{job}/retry', [SystemOperationsController::class, 'retryFailedJob'])->name('settings.operations.failed_jobs.retry');
        Route::delete('settings/operations/failed-jobs/{job}', [SystemOperationsController::class, 'forgetFailedJob'])->name('settings.operations.failed_jobs.forget');
        Route::delete('settings/operations/failed-jobs', [SystemOperationsController::class, 'flushFailedJobs'])->name('settings.operations.failed_jobs.flush');
        Route::delete('settings/operations/pending-jobs/{job}', [SystemOperationsController::class, 'deletePendingJob'])->name('settings.operations.pending_jobs.destroy');
    });

    Route::prefix('settings/disaster-recovery')->name('settings.disaster_recovery.')->group(function () {
        Route::get('/', [DisasterRecoveryController::class, 'index'])->name('index');
        Route::post('backups', [DisasterRecoveryController::class, 'storeBackup'])->name('backups.store');
        Route::get('backups/{backup}', [DisasterRecoveryController::class, 'showBackup'])->name('backups.show');
        Route::post('restores', [DisasterRecoveryController::class, 'storeRestore'])->name('restores.store');
        Route::post('restores/{restore}/approve', [DisasterRecoveryController::class, 'approveRestore'])->name('restores.approve');
        Route::post('restores/{restore}/reject', [DisasterRecoveryController::class, 'rejectRestore'])->name('restores.reject');
        Route::get('restore-tests', [DisasterRecoveryController::class, 'restoreTests'])->name('restore_tests.index');
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
