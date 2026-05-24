<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Services\Performance\EmployeeIdentityService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login_method' => ['required', Rule::in(['employee_number', 'email'])],
            'employee_number' => ['required_if:login_method,employee_number', 'nullable', 'string', 'max:100'],
            'email' => ['required_if:login_method,email', 'nullable', 'string', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        Auth::login(
            $this->validateCredentials(),
            $this->boolean('remember'),
        );
    }

    public function validateCredentials(): User
    {
        $this->ensureIsNotRateLimited();

        $user = $this->resolveUser();

        if (! $user || ! Hash::check($this->string('password')->toString(), $user->password)) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                $this->credentialField() => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            $this->credentialField() => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate($this->loginMethod().'|'.$this->loginIdentifier().'|'.$this->ip());
    }

    public function loginMethod(): string
    {
        return $this->string('login_method')->toString();
    }

    public function credentialField(): string
    {
        return $this->usesEmailLogin() ? 'email' : 'employee_number';
    }

    public function usesEmailLogin(): bool
    {
        return $this->loginMethod() === 'email';
    }

    private function loginIdentifier(): string
    {
        if ($this->usesEmailLogin()) {
            return Str::lower(trim($this->string('email')->toString()));
        }

        return app(EmployeeIdentityService::class)->normalizeEmployeeNumber(
            $this->string('employee_number')->toString(),
        );
    }

    private function resolveUser(): ?User
    {
        if ($this->usesEmailLogin()) {
            return User::query()
                ->where('email', $this->loginIdentifier())
                ->first();
        }

        return app(EmployeeIdentityService::class)->findUserByEmployeeNumber(
            $this->string('employee_number')->toString(),
        );
    }
}
