<?php

use App\Http\Controllers\Performance\DashboardController;
use App\Http\Controllers\Performance\EmployeeProfileCompletionController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'password.change'])->group(function () {
    Route::get('complete-profile', [EmployeeProfileCompletionController::class, 'create'])->name('employee-profile.complete');
    Route::post('complete-profile', [EmployeeProfileCompletionController::class, 'store'])->name('employee-profile.complete.store');

    Route::middleware('employee.profile.complete')->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
    });
});

require __DIR__.'/performance.php';
require __DIR__.'/access.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
