<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\EmailOtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorChallengeController extends Controller
{
    public function create(Request $request, EmailOtpService $emailOtp): Response|RedirectResponse
    {
        $user = $this->pendingLoginUser($request);

        if (! $user) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/two-factor-challenge', [
            'email' => $emailOtp->maskEmail($user->email),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request, EmailOtpService $emailOtp): RedirectResponse
    {
        $user = $this->pendingLoginUser($request);

        if (! $user) {
            return redirect()->route('login');
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'size:'.EmailOtpService::CODE_LENGTH],
        ]);

        $this->ensureVerificationIsNotRateLimited($request, $user);

        if (! $emailOtp->verifyLoginOtp($user, $validated['code'])) {
            RateLimiter::hit($this->verificationThrottleKey($request, $user));

            throw ValidationException::withMessages([
                'code' => 'The verification code is invalid or has expired.',
            ]);
        }

        RateLimiter::clear($this->verificationThrottleKey($request, $user));

        $remember = (bool) $request->session()->pull('login.remember', false);

        Auth::login($user, $remember);
        $request->session()->forget('login.id');
        $request->session()->regenerate();

        return $this->redirectAfterLogin($request);
    }

    public function resend(Request $request, EmailOtpService $emailOtp): RedirectResponse
    {
        $user = $this->pendingLoginUser($request);

        if (! $user) {
            return redirect()->route('login');
        }

        $emailOtp->ensureCanResend($user, $this->resendThrottleKey($request, $user));
        $emailOtp->sendLoginOtp($user);

        return back()->with('status', 'A new verification code has been sent to your email.');
    }

    private function pendingLoginUser(Request $request): ?User
    {
        $userId = $request->session()->get('login.id');

        if (! $userId) {
            return null;
        }

        return User::query()->find($userId);
    }

    private function redirectAfterLogin(Request $request): RedirectResponse
    {
        if (! $request->user()?->is_approved) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('pending-approval')
                ->with('error', 'Your account is pending admin approval.');
        }

        if ($request->user()?->force_password_change) {
            return redirect()->route('password.edit');
        }

        if (! $request->user()?->employeeProfile()->exists()) {
            return redirect()->route('employee-profile.complete');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    private function ensureVerificationIsNotRateLimited(Request $request, User $user): void
    {
        $key = $this->verificationThrottleKey($request, $user);

        if (! RateLimiter::tooManyAttempts($key, 5)) {
            return;
        }

        $seconds = RateLimiter::availableIn($key);

        throw ValidationException::withMessages([
            'code' => "Too many attempts. Try again in {$seconds} seconds.",
        ]);
    }

    private function verificationThrottleKey(Request $request, User $user): string
    {
        return 'email-mfa-verify:'.$user->id.'|'.$request->ip();
    }

    private function resendThrottleKey(Request $request, User $user): string
    {
        return 'email-mfa-resend:'.$user->id.'|'.$request->ip();
    }
}
