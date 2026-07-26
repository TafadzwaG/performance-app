<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccessSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        abort_unless($request->user()->can('system.settings.manage'), 403);

        $settings = SystemSetting::current();

        return Inertia::render('settings/access', [
            'openRegistrationEnabled' => (bool) $settings->open_registration_enabled,
            'autoApproveRegistrations' => (bool) $settings->auto_approve_registrations,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->can('system.settings.manage'), 403);

        $validated = $request->validate([
            'open_registration_enabled' => ['required', 'boolean'],
            'auto_approve_registrations' => ['required', 'boolean'],
        ]);

        SystemSetting::current()->update([
            'open_registration_enabled' => (bool) $validated['open_registration_enabled'],
            'auto_approve_registrations' => (bool) $validated['auto_approve_registrations'],
        ]);

        return back()->with('success', 'Access settings updated successfully.');
    }
}
