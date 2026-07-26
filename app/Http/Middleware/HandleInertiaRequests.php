<?php

namespace App\Http\Middleware;

use App\Http\Controllers\OrganizationContextController;
use App\Models\EmployeeProfile;
use App\Models\Organization;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\Performance\AppraisalWorkflowConfig;
use App\Services\Performance\PendingAppraisalNavService;
use App\Support\Branding;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Lab404\Impersonate\Services\ImpersonateManager;
use Spatie\Permission\PermissionRegistrar;

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
        $tenantContext = app(TenantContext::class);
        $currentOrganization = $tenantContext->organization();
        [$roles, $permissions] = $this->resolveAuthorizationContext($request, $user, $currentOrganization);
        $hasEmployeeProfile = $user !== null
            && $currentOrganization !== null
            && $user->employeeProfile()->exists();
        $canViewEmployees = $currentOrganization && ($user?->can('performance.employees.view')
            || $user?->can('performance.employees.create')
            || $user?->can('performance.employees.update'));
        $pendingAppraisalNav = app(PendingAppraisalNavService::class);
        $systemSettings = SystemSetting::query()->first();
        $showMyKpisNav = $user !== null && $currentOrganization !== null;
        $organizationOptions = $user
            ? OrganizationContextController::availableOrganizationsFor($user)
                ->map(fn (Organization $organization) => [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'slug' => $organization->slug,
                ])->values()->all()
            : [];

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'flash' => [
                'success' => $request->session()->get('success'),
                'info' => $request->session()->get('info'),
                'warning' => $request->session()->get('warning'),
                'error' => $request->session()->get('error'),
                'showFinalizeNextSteps' => (bool) $request->session()->pull('show_finalize_next_steps'),
            ],
            'auth' => [
                'user' => $request->user(),
                'roles' => $roles,
                'permissions' => $permissions,
                'requiresPasswordChange' => (bool) $request->user()?->force_password_change,
                'hasEmployeeProfile' => $hasEmployeeProfile,
                'requiresEmployeeProfileCompletion' => $user !== null
                    && $currentOrganization !== null
                    && ! $hasEmployeeProfile,
                'emailMfaEnabled' => (bool) $request->user()?->email_mfa_enabled,
                'canReportIssue' => $currentOrganization ? (bool) ($request->user()?->can('issues.create') ?? false) : false,
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
            'tenant' => [
                'current' => $currentOrganization ? [
                    'id' => $currentOrganization->id,
                    'name' => $currentOrganization->name,
                    'slug' => $currentOrganization->slug,
                    'timezone' => $currentOrganization->timezone,
                ] : null,
                'organizations' => $organizationOptions,
                'supportAccess' => $tenantContext->isSupportAccess(),
                'workflow' => $currentOrganization
                    ? app(AppraisalWorkflowConfig::class)->toSharedPayload()
                    : null,
            ],
            'nav' => [
                'employeesCount' => $canViewEmployees ? EmployeeProfile::query()->count() : null,
                'pendingAppraisalsCount' => $user && $currentOrganization && $pendingAppraisalNav->shouldShowFor($user)
                    ? $pendingAppraisalNav->countFor($user)
                    : null,
                'showMyKpis' => $showMyKpisNav,
                'profileUrl' => $user && $currentOrganization
                    ? ($hasEmployeeProfile
                        ? route('performance.profile.show')
                        : route('employee-profile.complete'))
                    : null,
            ],
            'branding' => [
                'logoUrl' => Branding::logoUrl(),
                'companyName' => $currentOrganization?->name ?? $systemSettings?->company_name,
            ],
        ]);
    }

    /**
     * @return array{0: list<string>, 1: list<string>}
     */
    private function resolveAuthorizationContext(Request $request, ?User $user, ?Organization $currentOrganization): array
    {
        if (! $user) {
            return [[], []];
        }

        $organizationId = $currentOrganization?->id ?? $request->session()->get('organization_id');

        if ($organizationId === null) {
            return [[], []];
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId((int) $organizationId);
        $user->unsetRelation('roles')->unsetRelation('permissions');

        return [
            $user->getRoleNames()->values()->all(),
            $user->getAllPermissions()->pluck('name')->values()->all(),
        ];
    }
}
