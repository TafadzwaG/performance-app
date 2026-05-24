<?php

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'SecurePass1!',
        'password_confirmation' => 'SecurePass1!',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('pending-approval'));
});
