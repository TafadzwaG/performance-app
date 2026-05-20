<?php

use App\Http\Controllers\Performance\DashboardController;
use App\Http\Controllers\Performance\EmployeeProfileCompletionController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('welcome');
})->name('home');

Route::get('/terms', function () {
    return Inertia::render('terms');
})->name('terms');

Route::middleware(['auth', 'approved', 'password.change'])->group(function () {
    Route::get('complete-profile', [EmployeeProfileCompletionController::class, 'create'])->name('employee-profile.complete');
    Route::post('complete-profile', [EmployeeProfileCompletionController::class, 'store'])->name('employee-profile.complete.store');

    Route::middleware('employee.profile.complete')->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::redirect('palette-settings', 'settings')->name('palette.settings');
    });
});

require __DIR__.'/performance.php';
require __DIR__.'/access.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
