<?php

namespace App\Services\Auth;

use App\Mail\LoginOtpMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EmailOtpService
{
    public const CODE_LENGTH = 6;

    public const EXPIRY_MINUTES = 10;

    public function sendLoginOtp(User $user): void
    {
        $code = $this->generateCode();

        Cache::put(
            $this->cacheKey($user),
            Hash::make($code),
            now()->addMinutes(self::EXPIRY_MINUTES),
        );

        try {
            Mail::to($user->email)->send(new LoginOtpMail($user, $code, self::EXPIRY_MINUTES));
        } catch (\Throwable $exception) {
            Cache::forget($this->cacheKey($user));

            Log::warning('Failed to send login OTP email', [
                'user_id' => $user->id,
                'error' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'email' => 'We could not send a verification code. Please try again or contact support.',
            ]);
        }
    }

    public function verifyLoginOtp(User $user, string $code): bool
    {
        $stored = Cache::get($this->cacheKey($user));

        if (! is_string($stored) || ! Hash::check($this->normalizeCode($code), $stored)) {
            return false;
        }

        Cache::forget($this->cacheKey($user));

        return true;
    }

    public function clearLoginOtp(User $user): void
    {
        Cache::forget($this->cacheKey($user));
    }

    public function ensureCanResend(User $user, string $throttleKey): void
    {
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'code' => "Please wait {$seconds} seconds before requesting another code.",
            ]);
        }

        RateLimiter::hit($throttleKey, 60);
    }

    public function maskEmail(string $email): string
    {
        if (! str_contains($email, '@')) {
            return $email;
        }

        [$local, $domain] = explode('@', $email, 2);
        $visible = Str::substr($local, 0, 1);

        return $visible.'***@'.$domain;
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 10 ** self::CODE_LENGTH - 1), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    private function normalizeCode(string $code): string
    {
        return preg_replace('/\D/', '', $code) ?? '';
    }

    private function cacheKey(User $user): string
    {
        return "email_mfa_login:{$user->id}";
    }
}
