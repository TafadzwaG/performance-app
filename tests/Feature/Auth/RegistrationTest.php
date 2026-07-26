<?php

use App\Models\SystemSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('open registration screen is disabled', function () {
    $response = $this->get('/register');

    $response->assertNotFound();
});

test('open registration submissions are disabled', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'SecurePass1!',
        'password_confirmation' => 'SecurePass1!',
    ]);

    $this->assertGuest();
    $response->assertNotFound();
    $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
});

test('login hides signup when open registration is disabled', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/login')
            ->where('canRegister', false));
});

test('enabled open registration shows the signup link and registration form', function () {
    SystemSetting::current()->update(['open_registration_enabled' => true]);

    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/login')
            ->where('canRegister', true));

    $this->get('/register')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/register'));
});

test('new users can register when open registration is enabled', function () {
    SystemSetting::current()->update(['open_registration_enabled' => true]);

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'SecurePass1!',
        'password_confirmation' => 'SecurePass1!',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('pending-approval'));

    $user = User::withoutGlobalScopes()->where('email', 'test@example.com')->firstOrFail();

    expect($user->is_approved)->toBeFalse()
        ->and($user->memberships()->where('status', 'invited')->exists())->toBeTrue();
});

test('new users bypass approval when automatic registration approval is enabled', function () {
    SystemSetting::current()->update([
        'open_registration_enabled' => true,
        'auto_approve_registrations' => true,
    ]);

    $response = $this->post('/register', [
        'name' => 'Approved User',
        'email' => 'approved@example.com',
        'password' => 'SecurePass1!',
        'password_confirmation' => 'SecurePass1!',
    ]);

    $this->assertGuest();
    $response
        ->assertRedirect(route('login'))
        ->assertSessionHas('status', 'Registration successful. Your account is active and you can now sign in.');

    $user = User::withoutGlobalScopes()->where('email', 'approved@example.com')->firstOrFail();
    $membership = $user->memberships()->firstOrFail();

    expect($user->is_approved)->toBeTrue()
        ->and($membership->status)->toBe('active')
        ->and($membership->activated_at)->not->toBeNull();
});
