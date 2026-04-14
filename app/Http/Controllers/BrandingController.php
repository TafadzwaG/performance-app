<?php

namespace App\Http\Controllers;

use App\Support\Branding;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BrandingController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'logo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:3072'],
        ]);

        Branding::updateLogo($validated['logo']);

        return back()->with('success', 'System logo updated successfully.');
    }

    public function destroy(): RedirectResponse
    {
        Branding::removeLogo();

        return back()->with('success', 'System logo reset to default.');
    }
}
