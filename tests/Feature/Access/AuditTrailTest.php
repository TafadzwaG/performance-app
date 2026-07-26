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
        ->withSession(['organization_id' => $user->memberships()->firstOrFail()->organization_id])
        ->post('/testing/audit-record', [
            'foo' => 'bar',
            'password' => 'secret-value',
        ])
        ->assertNoContent();

    $auditTrail = AuditTrail::withoutGlobalScopes()->first();

    expect($auditTrail)->not->toBeNull();
    expect($auditTrail?->user_id)->toBe($user->id);
    expect($auditTrail?->organization_id)->toBe($user->memberships()->firstOrFail()->organization_id);
    expect($auditTrail?->response_status)->toBe(204);
    expect($auditTrail?->request_payload)->toMatchArray([
        'foo' => 'bar',
    ]);
    expect($auditTrail?->request_payload)->not->toHaveKey('password');
});

test('login without tenant context does not crash when audit cannot resolve organization', function () {
    $this->post(route('login'), [
        'email' => 'missing-user@example.com',
        'password' => 'wrong-password',
    ])->assertRedirect();

    expect(AuditTrail::withoutGlobalScopes()->count())->toBe(0);
});

test('authorized user can view the audit trail page', function () {
    $user = User::factory()->create();

    Permission::findOrCreate('access.audit_trails.view', 'web');
    $user->givePermissionTo('access.audit_trails.view');

    $organizationId = $user->memberships()->firstOrFail()->organization_id;

    AuditTrail::withoutGlobalScopes()->create([
        'organization_id' => $organizationId,
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
        ->withSession(['organization_id' => $organizationId])
        ->get(route('access.audit-trails.index'))
        ->assertOk()
        ->assertSee('access\\/audit-trails\\/Index', false)
        ->assertSee('Test Record', false);
});
