<?php

use App\Models\AuditTrail;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

test('audit trail records mutating web requests', function () {
    Route::middleware('web')->post('/testing/audit-record', fn () => response()->noContent());

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/testing/audit-record', [
            'foo' => 'bar',
            'password' => 'secret-value',
        ])
        ->assertNoContent();

    $auditTrail = AuditTrail::query()->first();

    expect($auditTrail)->not->toBeNull();
    expect($auditTrail?->user_id)->toBe($user->id);
    expect($auditTrail?->response_status)->toBe(204);
    expect($auditTrail?->request_payload)->toMatchArray([
        'foo' => 'bar',
    ]);
    expect($auditTrail?->request_payload)->not->toHaveKey('password');
});

test('authorized user can view the audit trail page', function () {
    $user = User::factory()->create();

    Permission::findOrCreate('access.audit_trails.view', 'web');
    $user->givePermissionTo('access.audit_trails.view');

    AuditTrail::query()->create([
        'user_id' => $user->id,
        'action' => 'create',
        'method' => 'POST',
        'route_name' => 'testing.audit.record',
        'url' => 'http://localhost/testing/audit-record',
        'ip_address' => '127.0.0.1',
        'subject_label' => 'Test Record',
        'request_payload' => ['foo' => 'bar'],
        'response_status' => 201,
        'occurred_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('access.audit-trails.index'))
        ->assertOk()
        ->assertSee('access\\/audit-trails\\/Index', false)
        ->assertSee('Test Record', false);
});
