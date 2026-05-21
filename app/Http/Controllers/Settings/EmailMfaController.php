<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Auth\EmailOtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailMfaController extends Controller
{
    public function enable(Request $request, EmailOtpService $emailOtp): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
        ]);

        $user = $request->user();

        $user->forceFill([
            'email_mfa_enabled' => true,
            'email_mfa_enabled_at' => now(),
        ])->save();

        $emailOtp->clearLoginOtp($user);

        return to_route('profile.edit')->with('success', 'Email verification is now enabled for your account.');
    }

    public function disable(Request $request, EmailOtpService $emailOtp): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
        ]);

        $user = $request->user();

        $user->forceFill([
            'email_mfa_enabled' => false,
            'email_mfa_enabled_at' => null,
        ])->save();

        $emailOtp->clearLoginOtp($user);

        return to_route('profile.edit')->with('success', 'Email verification has been disabled for your account.');
    }
}
