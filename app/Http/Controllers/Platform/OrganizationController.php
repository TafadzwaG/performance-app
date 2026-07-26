<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\EmployeeProfile;
use App\Models\Location;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Services\Tenancy\TenantProvisioner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('platform/organizations/Index', [
            'organizations' => Organization::query()
                ->withCount([
                    'memberships',
                    'locations' => fn ($query) => $query->withoutGlobalScopes(),
                ])
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'status', 'timezone', 'email', 'phone', 'website', 'created_at']),
        ]);
    }

    public function show(Organization $organization): Response
    {
        $organization->load(['settings']);

        $memberships = OrganizationMembership::query()
            ->with(['user' => fn ($query) => $query->withoutGlobalScopes()->select('id', 'name', 'email')])
            ->where('organization_id', $organization->id)
            ->orderByDesc('is_default')
            ->orderBy('status')
            ->orderBy('user_id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (OrganizationMembership $membership) => [
                'id' => $membership->id,
                'status' => $membership->status,
                'is_default' => $membership->is_default,
                'access_all_locations' => $membership->access_all_locations,
                'activated_at' => optional($membership->activated_at)?->toIso8601String(),
                'user' => $membership->user?->only(['id', 'name', 'email']),
            ]);

        $locations = Location::withoutGlobalScopes()
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'city', 'country', 'timezone', 'is_active']);

        return Inertia::render('platform/organizations/Show', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'status' => $organization->status,
                'timezone' => $organization->timezone,
                'email' => $organization->email,
                'phone' => $organization->phone,
                'website' => $organization->website,
                'created_at' => optional($organization->created_at)?->toIso8601String(),
                'updated_at' => optional($organization->updated_at)?->toIso8601String(),
                'memberships_count' => $organization->memberships()->count(),
                'locations_count' => $locations->count(),
                'employees_count' => EmployeeProfile::withoutGlobalScopes()
                    ->where('organization_id', $organization->id)
                    ->count(),
            ],
            'settings' => $organization->settings ? [
                'legal_name' => $organization->settings->legal_name,
                'registration_number' => $organization->settings->registration_number,
                'calibration_enabled' => $organization->settings->calibration_enabled,
                'city' => $organization->settings->city,
                'country' => $organization->settings->country,
            ] : null,
            'locations' => $locations->map(fn (Location $location) => [
                'id' => $location->id,
                'name' => $location->name,
                'code' => $location->code,
                'city' => $location->city,
                'country' => $location->country,
                'timezone' => $location->timezone,
                'is_active' => $location->is_active,
            ])->values()->all(),
            'memberships' => $memberships,
        ]);
    }

    public function searchUsers(Request $request): JsonResponse
    {
        $q = trim((string) $request->string('q'));

        $users = User::withoutGlobalScopes()
            ->when($q !== '', function (Builder $query) use ($q) {
                $like = "%{$q}%";
                $query->where(function (Builder $sub) use ($like) {
                    $sub->where('name', 'like', $like)
                        ->orWhere('email', 'like', $like);
                });
            })
            ->orderBy('name')
            ->limit(25)
            ->get(['id', 'name', 'email']);

        return response()->json([
            'results' => $users->map(fn (User $user) => [
                'value' => $user->id,
                'label' => "{$user->name} ({$user->email})",
                'name' => $user->name,
                'email' => $user->email,
            ])->all(),
        ]);
    }

    public function store(Request $request, TenantProvisioner $provisioner): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'alpha_dash', 'max:100', 'unique:organizations,slug'],
            'timezone' => ['required', 'timezone'],
            'admin_user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $provisioner->create($validated);

        return back()->with('success', 'Organization provisioned and the selected administrator was assigned.');
    }

    public function update(Request $request, Organization $organization): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'alpha_dash', 'max:100', Rule::unique('organizations', 'slug')->ignore($organization->id)],
            'timezone' => ['required', 'timezone'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'url', 'max:255'],
        ]);

        $organization->update($validated);

        return back()->with('success', 'Organization updated.');
    }

    public function updateStatus(Request $request, Organization $organization): RedirectResponse
    {
        $validated = $request->validate(['status' => ['required', Rule::in(['active', 'suspended'])]]);
        $organization->update(['status' => $validated['status']]);

        return back()->with('success', 'Organization status updated.');
    }

    public function enterSupport(Request $request, Organization $organization): RedirectResponse
    {
        abort_unless($organization->isActive(), 422);
        $validated = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:500']]);

        $request->session()->put([
            'organization_id' => $organization->id,
            'platform_support_reason' => $validated['reason'],
        ]);

        AuditTrail::withoutGlobalScopes()->create([
            'organization_id' => $organization->id,
            'user_id' => $request->user()->id,
            'action' => 'platform_support_enter',
            'method' => 'POST',
            'route_name' => 'platform.organizations.support.enter',
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'subject_type' => Organization::class,
            'subject_id' => $organization->id,
            'subject_label' => $organization->name,
            'request_payload' => ['reason' => $validated['reason']],
            'response_status' => 302,
            'occurred_at' => now(),
        ]);

        return redirect()->route('dashboard')->with('warning', 'Platform support access is active and being audited.');
    }

    public function exitSupport(Request $request): RedirectResponse
    {
        $request->session()->forget(['organization_id', 'platform_support_reason']);

        return redirect()->route('platform.organizations.index');
    }
}
