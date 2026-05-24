<?php

use App\Http\Controllers\Access\AuditTrailController;
use App\Http\Controllers\Access\HelpController;
use App\Http\Controllers\Access\RoleController;
use App\Http\Controllers\Access\StorageManagementController;
use App\Http\Controllers\Access\UserController;
use App\Http\Controllers\Access\UserImpersonationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'approved', 'password.change', 'employee.profile.complete'])->prefix('access')->as('access.')->group(function () {
    Route::get('help', [HelpController::class, 'index'])->name('help.index');
    Route::get('help/download/{document}/{format}', [HelpController::class, 'download'])->name('help.download');

    Route::get('audit-trails', [AuditTrailController::class, 'index'])
        ->middleware('permission:access.audit_trails.view')
        ->name('audit-trails.index');

    Route::get('storage', [StorageManagementController::class, 'index'])->name('storage.index');
    Route::get('storage/download', [StorageManagementController::class, 'download'])->name('storage.download');
    Route::delete('storage/files', [StorageManagementController::class, 'deleteFile'])->name('storage.files.destroy');
    Route::delete('storage/{zone}', [StorageManagementController::class, 'purgeZone'])->name('storage.purge');

    Route::get('users/bulk-create', [UserController::class, 'bulkCreate'])->name('users.bulk_create');
    Route::post('users/bulk-create', [UserController::class, 'bulkStore'])->name('users.bulk_store');
    Route::get('users/import', [UserController::class, 'importCreate'])->name('users.import.create');
    Route::post('users/import', [UserController::class, 'importStore'])->name('users.import.store');
    Route::get('users/import/template', [UserController::class, 'downloadImportTemplate'])->name('users.import.template');
    Route::get('users/export', [UserController::class, 'export'])->name('users.export');

    Route::resource('users', UserController::class)
        ->parameters(['users' => 'user'])
        ->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy']);
    Route::get('users/{user}/deletion-impact', [UserController::class, 'deletionImpact'])->name('users.deletion_impact');
    Route::post('users/{user}/approve', [UserController::class, 'approve'])->name('users.approve');

    Route::post('users/{user}/impersonate', [UserImpersonationController::class, 'store'])
        ->name('users.impersonate.store');
    Route::delete('impersonation', [UserImpersonationController::class, 'destroy'])
        ->name('impersonation.destroy');

    Route::resource('roles', RoleController::class)
        ->parameters(['roles' => 'role'])
        ->except('destroy');
});
