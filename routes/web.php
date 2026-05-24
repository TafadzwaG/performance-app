<?php

use App\Http\Controllers\Performance\DashboardController;
use App\Http\Controllers\Performance\EmployeeProfileCompletionController;
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

Route::middleware(['auth', 'approved', 'password.change'])->group(function () {
    Route::get('complete-profile', [EmployeeProfileCompletionController::class, 'create'])->name('employee-profile.complete');
    Route::post('complete-profile', [EmployeeProfileCompletionController::class, 'store'])->name('employee-profile.complete.store');

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
