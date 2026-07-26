<?php

namespace App\Http\Controllers;

use App\Models\AuditTrail;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Services\Auth\PostLoginRedirector;
use App\Services\Performance\EmployeeImportService;
use App\Services\Performance\GoalLibraryImportService;
use App\Services\Tenancy\MembershipTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationContextController extends Controller
{
    public const PLATFORM_SWITCH_REASON = 'Tenant switched via app switcher';

    public function index(Request $request): Response
    {
        $user = $request->user();
        $memberships = $user->memberships()
            ->get(['organization_id', 'status', 'is_default'])
            ->keyBy('organization_id');
        $organizations = ($user->is_platform_admin
            ? self::availableOrganizationsFor($user)
            : Organization::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'slug']))
            ->map(fn (Organization $organization) => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'is_default' => (bool) $memberships->get($organization->id)?->is_default,
            ]);
        $currentOrganization = $this->resolveCurrentOrganization($request, $user);

        return Inertia::render('organizations/Select', [
            'organizations' => $organizations,
            'canTransferMembership' => ! $user->is_platform_admin,
            'currentOrganization' => $currentOrganization ? [
                'id' => $currentOrganization->id,
                'name' => $currentOrganization->name,
                'slug' => $currentOrganization->slug,
            ] : null,
        ]);
    }

    public function store(Request $request, PostLoginRedirector $redirector): RedirectResponse
    {
        $validated = $request->validate(['organization_id' => ['required', 'integer']]);
        $user = $request->user();
        $organizationId = (int) $validated['organization_id'];

        $membership = $user->memberships()
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->whereHas('organization', fn ($query) => $query->where('status', 'active'))
            ->first();

        if ($membership) {
            $request->session()->put('organization_id', $membership->organization_id);
            $this->clearTenantSessionState($request);

            return $redirector->redirectAfterOrganizationSelection($request);
        }

        abort_unless($user->is_platform_admin, 404);

        $organization = Organization::query()
            ->whereKey($organizationId)
            ->where('status', 'active')
            ->firstOrFail();

        $request->session()->put([
            'organization_id' => $organization->id,
            'platform_support_reason' => self::PLATFORM_SWITCH_REASON,
        ]);
        $this->clearTenantImportSessionState($request);

        AuditTrail::withoutGlobalScopes()->create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'action' => 'platform_support_enter',
            'method' => 'POST',
            'route_name' => 'organizations.switch',
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'subject_type' => Organization::class,
            'subject_id' => $organization->id,
            'subject_label' => $organization->name,
            'request_payload' => ['reason' => self::PLATFORM_SWITCH_REASON],
            'response_status' => 302,
            'occurred_at' => now(),
        ]);

        return redirect()->route('dashboard')->with('warning', 'Platform support access is active and being audited.');
    }

    public function transfer(
        Request $request,
        PostLoginRedirector $redirector,
        MembershipTransferService $transferService,
    ): RedirectResponse {
        $validated = $request->validate(['organization_id' => ['required', 'integer']]);
        $user = $request->user();

        abort_if($user->is_platform_admin, 403);

        $organization = Organization::query()
            ->whereKey((int) $validated['organization_id'])
            ->where('status', 'active')
            ->firstOrFail();

        $transferService->transfer($user, $organization);

        $request->session()->put('organization_id', $organization->id);
        $this->clearTenantSessionState($request);

        return $redirector->redirectAfterOrganizationSelection($request)
            ->with('success', "Your membership was transferred to {$organization->name}.");
    }

    public function activate(Request $request, Organization $organization): RedirectResponse
    {
        $request->user()->memberships()
            ->where('organization_id', $organization->id)
            ->where('status', 'active')
            ->firstOrFail();
        abort_unless($organization->isActive(), 404);

        $target = (string) $request->query('redirect', '/dashboard');
        abort_unless(str_starts_with($target, '/') && ! str_starts_with($target, '//'), 422);

        $request->session()->put('organization_id', $organization->id);
        $this->clearTenantSessionState($request);

        return redirect()->to($target);
    }

    /**
     * @return Collection<int, Organization>
     */
    public static function availableOrganizationsFor($user): Collection
    {
        if ($user?->is_platform_admin) {
            return Organization::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'slug']);
        }

        return $user->organizations()
            ->wherePivot('status', 'active')
            ->where('organizations.status', 'active')
            ->orderBy('name')
            ->get(['organizations.id', 'organizations.name', 'organizations.slug']);
    }

    private function clearTenantSessionState(Request $request): void
    {
        $request->session()->forget([
            'platform_support_reason',
            EmployeeImportService::SESSION_KEY,
            GoalLibraryImportService::SESSION_KEY,
        ]);
    }

    private function clearTenantImportSessionState(Request $request): void
    {
        $request->session()->forget([
            EmployeeImportService::SESSION_KEY,
            GoalLibraryImportService::SESSION_KEY,
        ]);
    }

    private function resolveCurrentOrganization(Request $request, $user): ?Organization
    {
        $sessionOrganizationId = $request->session()->get('organization_id');

        if ($sessionOrganizationId) {
            $membership = OrganizationMembership::query()
                ->with('organization')
                ->where('user_id', $user->id)
                ->where('organization_id', (int) $sessionOrganizationId)
                ->where('status', 'active')
                ->whereHas('organization', fn ($query) => $query->where('status', 'active'))
                ->first();

            if ($membership?->organization) {
                return $membership->organization;
            }
        }

        $memberships = OrganizationMembership::query()
            ->with('organization')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->whereHas('organization', fn ($query) => $query->where('status', 'active'))
            ->orderByDesc('is_default')
            ->get();

        if ($memberships->count() === 1) {
            return $memberships->first()->organization;
        }

        $defaultMembership = $memberships->firstWhere('is_default', true);

        return $defaultMembership?->organization;
    }
}
