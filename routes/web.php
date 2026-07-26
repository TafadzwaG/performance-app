<?php

use App\Http\Controllers\OrganizationContextController;
use App\Http\Controllers\Performance\DashboardController;
use App\Http\Controllers\Performance\EmployeeProfileCompletionController;
use App\Http\Controllers\Performance\Setup\DepartmentController;
use App\Http\Controllers\Performance\Setup\JobTitleController;
use App\Http\Controllers\Platform\MembershipController as PlatformMembershipController;
use App\Http\Controllers\Platform\OrganizationController as PlatformOrganizationController;
use App\Services\Performance\WelcomePlatformStatsService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (WelcomePlatformStatsService $welcomeStats) {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('welcome', [
        'platformStats' => $welcomeStats->snapshot(),
    ]);
})->name('home');

Route::get('/terms', function () {
    return Inertia::render('terms');
})->name('terms');

Route::get('/privacy-policy', function () {
    return Inertia::render('privacy-policy');
})->name('privacy-policy');

Route::get('/privacy-notice', function () {
    return Inertia::render('privacy-notice');
})->name('privacy-notice');

Route::get('/support', function () {
    return Inertia::render('support');
})->name('support');

Route::middleware('auth')->group(function () {
    Route::get('organizations/select', [OrganizationContextController::class, 'index'])->name('organizations.select');
    Route::post('organizations/switch', [OrganizationContextController::class, 'store'])->name('organizations.switch');
    Route::post('organizations/transfer', [OrganizationContextController::class, 'transfer'])->name('organizations.transfer');
    Route::get('organizations/{organization}/activate', [OrganizationContextController::class, 'activate'])->name('organizations.activate');
});

Route::middleware(['auth', 'platform.admin'])->prefix('platform')->as('platform.')->group(function () {
    Route::get('organizations', [PlatformOrganizationController::class, 'index'])->name('organizations.index');
    Route::get('organizations/{organization}', [PlatformOrganizationController::class, 'show'])->name('organizations.show');
    Route::get('users/lookup', [PlatformOrganizationController::class, 'searchUsers'])->name('users.lookup');
    Route::post('organizations', [PlatformOrganizationController::class, 'store'])->name('organizations.store');
    Route::patch('organizations/{organization}', [PlatformOrganizationController::class, 'update'])->name('organizations.update');
    Route::patch('organizations/{organization}/status', [PlatformOrganizationController::class, 'updateStatus'])->name('organizations.status');
    Route::post('organizations/{organization}/support', [PlatformOrganizationController::class, 'enterSupport'])->name('organizations.support.enter');
    Route::get('memberships', [PlatformMembershipController::class, 'index'])->name('memberships.index');
    Route::get('memberships/export', [PlatformMembershipController::class, 'export'])->name('memberships.export');
    Route::delete('support', [PlatformOrganizationController::class, 'exitSupport'])->name('support.exit');
});

Route::middleware(['auth', 'tenant', 'approved', 'password.change'])->group(function () {
    Route::get('complete-profile', [EmployeeProfileCompletionController::class, 'create'])->name('employee-profile.complete');
    Route::post('complete-profile', [EmployeeProfileCompletionController::class, 'store'])->name('employee-profile.complete.store');
    Route::post('performance/setup/departments/quick', [DepartmentController::class, 'quickStore'])->name('performance.setup.departments.quick_store');
    Route::post('performance/setup/job-titles/quick', [JobTitleController::class, 'quickStore'])->name('performance.setup.job_titles.quick_store');

    Route::middleware('employee.profile.complete')->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::redirect('palette-settings', 'settings')->name('palette.settings');
    });
});

require __DIR__.'/issues.php';
require __DIR__.'/performance.php';
require __DIR__.'/access.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
