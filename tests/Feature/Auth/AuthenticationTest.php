<?php

use App\Models\EmployeeProfile;
use App\Models\User;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using email', function () {
    $user = User::factory()->create();
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-AUTH-001',
    ]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('organizations.select', absolute: false));
});

test('users reach the dashboard after choosing an organization', function () {
    $user = User::factory()->create();
    EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-AUTH-003',
    ]);

    $organization = $user->memberships()->first()->organization;

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('organizations.select'));

    $this->post(route('organizations.switch'), [
        'organization_id' => $organization->id,
    ])->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();
    $profile = EmployeeProfile::factory()->for($user)->create([
        'employee_number' => 'EMP-AUTH-002',
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('employee number is not accepted as a login identifier', function () {
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
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('users can authenticate with email when they have no employee profile', function () {
    $user = User::factory()->create([
        'email' => 'email.login@example.com',
    ]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('organizations.select', absolute: false));
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});
