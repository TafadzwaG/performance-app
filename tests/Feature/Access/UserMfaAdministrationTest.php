<?php

use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('authorized admin can view user mfa administration page', function () {
    $admin = mfaAdminUser();
    $user = User::factory()->withEmailMfa()->create(['name' => 'MFA User']);

    $this->actingAs($admin)
        ->get(route('access.users.mfa.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('access/users/Mfa')
            ->where('globalMfaRequired', false)
            ->where('canManageUserMfa', true)
            ->has('users.data', 2)
            ->where('users.data.1.name', $user->name)
            ->where('users.data.1.email_mfa_enabled', true)
        );
});

test('authorized admin can enable and disable user mfa', function () {
    $admin = mfaAdminUser();
    $user = User::factory()->create([
        'email_mfa_enabled' => false,
        'email_mfa_enabled_at' => null,
    ]);

    $this->actingAs($admin)
        ->put(route('access.users.mfa.update', $user), ['enabled' => true])
        ->assertRedirect();

    expect($user->fresh()->email_mfa_enabled)->toBeTrue()
        ->and($user->fresh()->email_mfa_enabled_at)->not->toBeNull();

    $this->actingAs($admin)
        ->put(route('access.users.mfa.update', $user), ['enabled' => false])
        ->assertRedirect();

    expect($user->fresh()->email_mfa_enabled)->toBeFalse()
        ->and($user->fresh()->email_mfa_enabled_at)->toBeNull();
});

test('per-user mfa changes are blocked while global mfa is enforced', function () {
    $admin = mfaAdminUser();
    $user = User::factory()->create([
        'email_mfa_enabled' => false,
    ]);

    SystemSetting::query()->create([
        'email_mfa_required' => true,
    ]);

    $this->actingAs($admin)
        ->from(route('access.users.mfa.index'))
        ->put(route('access.users.mfa.update', $user), ['enabled' => true])
        ->assertRedirect(route('access.users.mfa.index'))
        ->assertSessionHasErrors('mfa');

    expect($user->fresh()->email_mfa_enabled)->toBeFalse();
});

function mfaAdminUser(): User
{
    Permission::findOrCreate('access.users.view', 'web');
    Permission::findOrCreate('access.users.update', 'web');

    $admin = User::factory()->create([
        'is_approved' => true,
        'name' => 'Admin User',
    ]);
    $admin->givePermissionTo(['access.users.view', 'access.users.update']);
    EmployeeProfile::factory()->for($admin)->create();

    return $admin;
}
