<?php

use App\Models\EmployeeProfile;
use App\Models\User;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-AUTH-001',
    ]);

    $response = $this->post('/login', [
        'login_method' => 'employee_number',
        'employee_number' => $profile->employee_number,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-AUTH-002',
    ]);

    $this->post('/login', [
        'login_method' => 'employee_number',
        'employee_number' => $profile->employee_number,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users without an employee profile can not authenticate', function () {
    User::factory()->create([
        'email' => 'no.profile@example.com',
    ]);

    $this->from('/login')
        ->post('/login', [
            'login_method' => 'employee_number',
            'employee_number' => 'EMP-MISSING-001',
            'password' => 'password',
        ])
        ->assertRedirect('/login')
        ->assertSessionHasErrors('employee_number');

    $this->assertGuest();
});

test('users can authenticate with email when they have no employee profile', function () {
    $user = User::factory()->create([
        'email' => 'email.login@example.com',
    ]);

    $response = $this->post('/login', [
        'login_method' => 'email',
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('employee-profile.complete', absolute: false));
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});
