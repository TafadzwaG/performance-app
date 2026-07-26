<?php

namespace App\Services\Auth;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PostLoginRedirector
{
    public function redirect(Request $request): RedirectResponse
    {
        $user = $request->user();
        $memberships = $this->activeMemberships($user);

        if ($user->is_platform_admin && $memberships->isEmpty()) {
            return redirect()->route('platform.organizations.index');
        }

        if (! $user->is_platform_admin) {
            return redirect()->route('organizations.select');
        }

        $membership = $memberships->count() === 1
            ? $memberships->first()
            : ($memberships->where('is_default', true)->count() === 1 ? $memberships->firstWhere('is_default', true) : null);

        if (! $membership) {
            return redirect()->route('organizations.select');
        }

        $request->session()->put('organization_id', $membership->organization_id);

        return $this->redirectAfterOrganizationSelection($request);
    }

    public function redirectAfterOrganizationSelection(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $request->session()->has('organization_id')) {
            return redirect()->route('organizations.select');
        }

        if ($user->force_password_change) {
            return redirect()->route('password.edit');
        }

        $organizationId = (int) $request->session()->get('organization_id');

        $hasProfile = $user->employeeProfiles()
            ->withoutGlobalScopes()
            ->where('organization_id', $organizationId)
            ->exists();

        if (! $hasProfile) {
            return redirect()->route('employee-profile.complete');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function activeMemberships($user)
    {
        return $user->memberships()
            ->with('organization')
            ->where('status', 'active')
            ->whereHas('organization', fn ($query) => $query->where('status', 'active'))
            ->orderByDesc('is_default')
            ->get();
    }
}
