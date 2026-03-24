<?php

use App\Models\EmployeeProfile;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user);

    $this->get('/dashboard')->assertOk();
});
