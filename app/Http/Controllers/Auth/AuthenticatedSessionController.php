<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\SystemSetting;
use App\Services\Auth\EmailOtpService;
use App\Services\Auth\PostLoginRedirector;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'canRegister' => Route::has('register') && (bool) SystemSetting::current()->open_registration_enabled,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request, EmailOtpService $emailOtp, PostLoginRedirector $redirector): RedirectResponse
    {
        $user = $request->validateCredentials();

        if (! $user->is_platform_admin && ! $user->memberships()->where('status', 'active')->exists()) {
            return redirect()
                ->route('pending-approval')
                ->with('error', 'Your account is pending admin approval.');
        }

        if (SystemSetting::current()->email_mfa_required || $user->hasEmailMfaEnabled()) {
            $request->session()->put([
                'login.id' => $user->id,
                'login.remember' => $request->boolean('remember'),
            ]);

            $emailOtp->sendLoginOtp($user);

            return redirect()->route('two-factor.login');
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return $redirector->redirect($request);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
