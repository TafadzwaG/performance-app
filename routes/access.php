<?php

use App\Http\Controllers\Access\RoleController;
use App\Http\Controllers\Access\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('access')->as('access.')->group(function () {
    Route::resource('users', UserController::class)
        ->parameters(['users' => 'user'])
        ->only(['index', 'show', 'edit', 'update']);

    Route::resource('roles', RoleController::class)
        ->parameters(['roles' => 'role'])
        ->except('destroy');
});
