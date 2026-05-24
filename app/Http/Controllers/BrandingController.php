<?php

namespace App\Http\Controllers;

use App\Support\Branding;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BrandingController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $this->authorize('system.settings.manage');

        $validated = $request->validate([
            'logo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:3072'],
        ]);

        Branding::updateLogo($validated['logo']);

        return back()->with('success', 'System logo updated successfully.');
    }

    public function destroy(): RedirectResponse
    {
        $this->authorize('system.settings.manage');

        Branding::removeLogo();

        return back()->with('success', 'System logo reset to default.');
    }
}
