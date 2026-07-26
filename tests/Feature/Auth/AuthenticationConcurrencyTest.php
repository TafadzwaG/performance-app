<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('more than twenty five distinct users may attempt login from one shared ip', function () {
    for ($index = 1; $index <= 30; $index++) {
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.25'])
            ->from('/login')
            ->post('/login', [
                'email' => "shared-office-user-{$index}@example.test",
                'password' => 'invalid-password',
            ])
            ->assertRedirect('/login')
            ->assertSessionHasErrors('email');
    }
});

test('mfa verification is isolated per pending user behind one shared ip', function () {
    $users = User::factory()->count(30)->create();

    foreach ($users as $user) {
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.26'])
            ->withSession(['login.id' => $user->id])
            ->from(route('two-factor.login'))
            ->post(route('two-factor.verify'), ['code' => '000000'])
            ->assertRedirect(route('two-factor.login'))
            ->assertSessionHasErrors('code');
    }
});

test('one account is still protected from excessive login requests', function () {
    for ($attempt = 1; $attempt <= 10; $attempt++) {
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.27'])
            ->post('/login', [
                'email' => 'targeted-account@example.test',
                'password' => 'invalid-password',
            ]);
    }

    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.27'])
        ->post('/login', [
            'email' => 'targeted-account@example.test',
            'password' => 'invalid-password',
        ])
        ->assertTooManyRequests();
});
