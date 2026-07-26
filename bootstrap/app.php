<?php

use App\Http\Middleware\EnsureOpenRegistrationEnabled;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\InitializeTenantContext;
use App\Http\Middleware\RecordAuditTrail;
use App\Http\Middleware\RequireApprovedUser;
use App\Http\Middleware\RequireEmployeeProfileCompletion;
use App\Http\Middleware\RequirePasswordChange;
use App\Http\Middleware\RequirePlatformAdmin;
use App\Http\Middleware\ResolveTenant;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->priority([
            InitializeTenantContext::class,
            SubstituteBindings::class,
        ]);

        $middleware->web(append: [
            InitializeTenantContext::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            RecordAuditTrail::class,
            SecurityHeaders::class,
        ]);

        $middleware->alias([
            'permission' => PermissionMiddleware::class,
            'role' => RoleMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'password.change' => RequirePasswordChange::class,
            'approved' => RequireApprovedUser::class,
            'tenant' => ResolveTenant::class,
            'platform.admin' => RequirePlatformAdmin::class,
            'employee.profile.complete' => RequireEmployeeProfileCompletion::class,
            'registration.open' => EnsureOpenRegistrationEnabled::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
