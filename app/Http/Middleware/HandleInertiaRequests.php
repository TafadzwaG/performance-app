<?php

namespace App\Http\Middleware;

use App\Models\EmployeeProfile;
use App\Support\Branding;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Lab404\Impersonate\Services\ImpersonateManager;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $impersonationManager = app(ImpersonateManager::class);
        $impersonator = $impersonationManager->isImpersonating()
            ? $impersonationManager->getImpersonator()
            : null;
        $user = $request->user();
        $canViewEmployees = $user?->can('performance.employees.view')
            || $user?->can('performance.employees.create')
            || $user?->can('performance.employees.update');

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'flash' => [
                'success' => $request->session()->get('success'),
                'info' => $request->session()->get('info'),
                'warning' => $request->session()->get('warning'),
                'error' => $request->session()->get('error'),
                'generatedCredentials' => $request->session()->get('generated_credentials'),
            ],
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->getRoleNames()->values()->all() ?? [],
                'permissions' => $request->user()?->getAllPermissions()->pluck('name')->values()->all() ?? [],
                'requiresPasswordChange' => (bool) $request->user()?->force_password_change,
                'hasEmployeeProfile' => (bool) $request->user()?->employeeProfile()->exists(),
                'requiresEmployeeProfileCompletion' => $request->user()
                    ? ! $request->user()->employeeProfile()->exists()
                    : false,
                'impersonation' => [
                    'isImpersonating' => $impersonationManager->isImpersonating(),
                    'impersonator' => $impersonator
                        ? [
                            'id' => $impersonator->id,
                            'name' => $impersonator->name,
                            'email' => $impersonator->email,
                        ]
                        : null,
                ],
            ],
            'nav' => [
                'employeesCount' => $canViewEmployees ? EmployeeProfile::query()->count() : null,
            ],
            'branding' => [
                'logoUrl' => Branding::logoUrl(),
            ],
        ]);
    }
}
