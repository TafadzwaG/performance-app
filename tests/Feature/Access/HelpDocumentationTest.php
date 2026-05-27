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
        ->assertSee('Employee User Manual', false)
        ->assertSee('Employee Performance Appraisal System Flow', false);
});

test('authenticated user can preview the system process flow chart', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $this->actingAs($user)
        ->get(route('access.help.preview', ['document' => 'system-flow-diagram']))
        ->assertOk()
        ->assertHeader('content-type', 'text/html; charset=UTF-8')
        ->assertSee('Employee Performance Appraisal System Flow', false);
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

test('authenticated user can download the system flow diagram pdf', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $this->actingAs($user)
        ->get(route('access.help.download', [
            'document' => 'system-flow-diagram',
            'format' => 'pdf',
        ]))
        ->assertOk()
        ->assertDownload('SYSTEM_FLOW_DIAGRAM.pdf');
});
