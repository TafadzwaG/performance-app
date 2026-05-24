<?php

use App\Models\EmployeeProfile;
use App\Models\User;
use App\Notifications\Auth\ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('reset password link screen can be rendered', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('reset password link can be requested', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

test('reset password link can be requested for unknown email without revealing account state', function () {
    Notification::fake();

    $this->post('/forgot-password', ['email' => 'missing@example.com'])
        ->assertRedirect()
        ->assertSessionHas('status', 'A reset link will be sent if the account exists.');

    Notification::assertNothingSent();
});

test('reset password screen can be rendered', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($user) {
        $response = $this->get('/reset-password/'.$notification->token.'?email='.urlencode($user->email));

        $response->assertStatus(200);

        return true;
    });
});

test('password can be reset with valid token', function () {
    Notification::fake();

    $user = User::factory()->create([
        'force_password_change' => true,
        'password_changed_at' => null,
    ]);

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($user) {
        $response = $this->post('/reset-password', [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'ResetPass1!',
            'password_confirmation' => 'ResetPass1!',
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', 'Your password has been reset. You can sign in with your new password.');

        $user->refresh();

        expect($user->force_password_change)->toBeFalse()
            ->and($user->password_changed_at)->not->toBeNull()
            ->and(Hash::check('ResetPass1!', $user->password))->toBeTrue();

        return true;
    });
});

test('user can sign in after resetting password', function () {
    Notification::fake();

    $user = User::factory()->create([
        'is_approved' => true,
        'force_password_change' => true,
    ]);
    EmployeeProfile::factory()->for($user)->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($user) {
        $this->post('/reset-password', [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'ResetPass1!',
            'password_confirmation' => 'ResetPass1!',
        ])->assertRedirect(route('login'));

        $this->post('/login', [
            'login_method' => 'email',
            'email' => $user->email,
            'password' => 'ResetPass1!',
        ])->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user->fresh());

        return true;
    });
});
