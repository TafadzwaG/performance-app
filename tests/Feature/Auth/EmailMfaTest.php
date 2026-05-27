<?php

use App\Mail\LoginOtpMail;
use App\Models\EmployeeProfile;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('login redirects to email verification when mfa is enabled', function () {
    Mail::fake();

    $user = User::factory()->withEmailMfa()->create();
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-MFA-001',
    ]);

    $this->post('/login', [
        'login_method' => 'employee_number',
        'employee_number' => $profile->employee_number,
        'password' => 'password',
    ])
        ->assertRedirect(route('two-factor.login'));

    $this->assertGuest();
    expect(session('login.id'))->toBe($user->id);

    Mail::assertQueued(LoginOtpMail::class, fn (LoginOtpMail $mail) => $mail->hasTo($user->email));
});

test('user can complete login with a valid email verification code', function () {
    $user = User::factory()->withEmailMfa()->create();
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-MFA-002',
    ]);

    $this->post('/login', [
        'login_method' => 'employee_number',
        'employee_number' => $profile->employee_number,
        'password' => 'password',
    ])->assertRedirect(route('two-factor.login'));

    $code = '482910';
    Cache::put('email_mfa_login:'.$user->id, Hash::make($code), now()->addMinutes(10));

    $this->withSession(['login.id' => $user->id, 'login.remember' => false])
        ->post(route('two-factor.verify'), ['code' => $code])
        ->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticatedAs($user);
});

test('invalid verification code is rejected', function () {
    $user = User::factory()->withEmailMfa()->create();
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-MFA-003',
    ]);

    $this->post('/login', [
        'login_method' => 'employee_number',
        'employee_number' => $profile->employee_number,
        'password' => 'password',
    ]);

    $this->withSession(['login.id' => $user->id])
        ->from(route('two-factor.login'))
        ->post(route('two-factor.verify'), ['code' => '000000'])
        ->assertRedirect(route('two-factor.login'))
        ->assertSessionHasErrors('code');

    $this->assertGuest();
});

test('user can enable and disable email verification from profile settings', function () {
    $user = User::factory()->create([
        'password' => Hash::make('Confirm@Password1'),
    ]);
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('email-mfa.enable'), ['current_password' => 'Confirm@Password1'])
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh()->email_mfa_enabled)->toBeTrue();

    $this->actingAs($user)
        ->delete(route('email-mfa.disable'), ['current_password' => 'Confirm@Password1'])
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh()->email_mfa_enabled)->toBeFalse();
});

test('enabling email verification requires the current password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('Confirm@Password1'),
    ]);
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('email-mfa.enable'), ['current_password' => 'wrong-password'])
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHasErrors('current_password');

    expect($user->fresh()->email_mfa_enabled)->toBeFalse();
});

test('users without mfa can still log in normally', function () {
    $user = User::factory()->create();
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-MFA-004',
    ]);

    $this->post('/login', [
        'login_method' => 'employee_number',
        'employee_number' => $profile->employee_number,
        'password' => 'password',
    ])
        ->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticatedAs($user);
});

test('global email mfa requires verification even when user mfa is disabled', function () {
    Mail::fake();

    SystemSetting::query()->create([
        'email_mfa_required' => true,
    ]);

    $user = User::factory()->create([
        'email_mfa_enabled' => false,
    ]);
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-MFA-005',
    ]);

    $this->post('/login', [
        'login_method' => 'employee_number',
        'employee_number' => $profile->employee_number,
        'password' => 'password',
    ])
        ->assertRedirect(route('two-factor.login'));

    $this->assertGuest();
    expect(session('login.id'))->toBe($user->id);

    Mail::assertQueued(LoginOtpMail::class, fn (LoginOtpMail $mail) => $mail->hasTo($user->email));
});
