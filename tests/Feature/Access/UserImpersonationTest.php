<?php

use App\Models\Permission;
use App\Models\User;
use Lab404\Impersonate\Services\ImpersonateManager;

test('authorized user can impersonate another user and leave impersonation', function () {
    $superAdmin = User::factory()->create();
    $employee = User::factory()->create();

    grantAccessPermissions($superAdmin, [
        'access.users.view',
        'access.users.impersonate',
    ]);

    $this->actingAs($superAdmin)
        ->post(route('access.users.impersonate.store', $employee))
        ->assertRedirect(route('dashboard'));

    expect(app(ImpersonateManager::class)->isImpersonating())->toBeTrue();
    $this->assertAuthenticatedAs($employee);

    $this->delete(route('access.impersonation.destroy'))
        ->assertRedirect(route('access.users.index'));

    expect(app(ImpersonateManager::class)->isImpersonating())->toBeFalse();
    $this->assertAuthenticatedAs($superAdmin);
});

test('user without impersonation permission cannot impersonate another user', function () {
    $user = User::factory()->create();
    $target = User::factory()->create();

    $this->actingAs($user)
        ->post(route('access.users.impersonate.store', $target))
        ->assertForbidden();
});

test('user cannot impersonate themselves', function () {
    $user = User::factory()->create();

    grantAccessPermissions($user, [
        'access.users.impersonate',
    ]);

    $this->actingAs($user)
        ->post(route('access.users.impersonate.store', $user))
        ->assertForbidden();
});

function grantAccessPermissions(User $user, array $permissions): void
{
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);
}
