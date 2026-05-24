<?php

use App\Models\EmployeeProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can view the help and documentation page', function () {
    $user = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('access.help.index'))
        ->assertOk()
        ->assertSee('access\\/help\\/Index', false)
        ->assertSee('Technical Documentation', false)
        ->assertSee('Employee User Manual', false);
});

test('authenticated user can download markdown documentation', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $this->actingAs($user)
        ->get(route('access.help.download', [
            'document' => 'general-user-manual',
            'format' => 'md',
        ]))
        ->assertOk()
        ->assertDownload('USER_MANUAL.md');
});

test('authenticated user can download generated pdf documentation', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $this->actingAs($user)
        ->get(route('access.help.download', [
            'document' => 'employee-user-manual',
            'format' => 'pdf',
        ]))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});
