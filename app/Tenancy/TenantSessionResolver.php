<?php

namespace App\Tenancy;

use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Spatie\Permission\PermissionRegistrar;

class TenantSessionResolver
{
    /**
     * Resolve the active tenant for an authenticated request.
     * Honors an explicit session selection and never silently falls back to a
     * different organization when the session choice is invalid.
     */
    public function resolveForUser(User $user, Request $request): ?TenantResolution
    {
        $sessionOrganizationId = $request->session()->get('organization_id');

        if ($sessionOrganizationId) {
            if ($user->is_platform_admin && $request->session()->has('platform_support_reason')) {
                $organization = Organization::query()
                    ->whereKey((int) $sessionOrganizationId)
                    ->where('status', 'active')
                    ->first();

                if ($organization) {
                    return new TenantResolution($organization, true);
                }

                return null;
            }

            $membership = $this->activeMembership($user->id, (int) $sessionOrganizationId);

            if ($membership?->organization) {
                return new TenantResolution($membership->organization, false);
            }

            return null;
        }

        $memberships = $this->activeMemberships($user);

        if ($memberships->count() === 1) {
            $organization = $memberships->first()->organization;
            $request->session()->put('organization_id', $organization->id);

            return new TenantResolution($organization, false);
        }

        $defaultMemberships = $memberships->where('is_default', true);

        if ($defaultMemberships->count() === 1) {
            $organization = $defaultMemberships->first()->organization;
            $request->session()->put('organization_id', $organization->id);

            return new TenantResolution($organization, false);
        }

        return null;
    }

    /**
     * Lightweight session restore for early middleware (for example route model binding).
     * Full membership validation still happens later in ResolveTenant.
     */
    public function resolveFromSession(Request $request): ?TenantResolution
    {
        $organizationId = $request->session()->get('organization_id');

        if (! $organizationId) {
            return null;
        }

        $organization = Organization::query()
            ->whereKey((int) $organizationId)
            ->where('status', 'active')
            ->first();

        if (! $organization) {
            return null;
        }

        return new TenantResolution($organization, $request->session()->has('platform_support_reason'));
    }

    public function apply(TenantResolution $resolution): void
    {
        app(TenantContext::class)->set($resolution->organization, $resolution->supportAccess);
        app(PermissionRegistrar::class)->setPermissionsTeamId($resolution->organization->id);
    }

    /**
     * @return Collection<int, OrganizationMembership>
     */
    private function activeMemberships(User $user): Collection
    {
        return OrganizationMembership::query()
            ->with('organization')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->whereHas('organization', fn ($query) => $query->where('status', 'active'))
            ->orderByDesc('is_default')
            ->get();
    }

    private function activeMembership(int $userId, int $organizationId): ?OrganizationMembership
    {
        return OrganizationMembership::query()
            ->with('organization')
            ->where('organization_id', $organizationId)
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->whereHas('organization', fn ($query) => $query->where('status', 'active'))
            ->first();
    }
}
