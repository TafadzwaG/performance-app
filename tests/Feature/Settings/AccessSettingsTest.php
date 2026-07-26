<?php

use App\Models\Permission;
use App\Models\SystemSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('authorized users can view access settings', function () {
    $user = accessSettingsUser();

    SystemSetting::current()->update([
        'open_registration_enabled' => true,
        'auto_approve_registrations' => true,
    ]);

    $this->actingAs($user)
        ->get(route('settings.access.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/access')
            ->where('openRegistrationEnabled', true)
            ->where('autoApproveRegistrations', true));
});

test('authorized users can update registration access and automatic approval', function () {
    $user = accessSettingsUser();

    $this->actingAs($user)
        ->put(route('settings.access.update'), [
            'open_registration_enabled' => true,
            'auto_approve_registrations' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SystemSetting::current()->open_registration_enabled)->toBeTrue()
        ->and(SystemSetting::current()->auto_approve_registrations)->toBeTrue();

    $this->actingAs($user)
        ->put(route('settings.access.update'), [
            'open_registration_enabled' => false,
            'auto_approve_registrations' => false,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SystemSetting::current()->open_registration_enabled)->toBeFalse()
        ->and(SystemSetting::current()->auto_approve_registrations)->toBeFalse();
});

test('users without system settings permission cannot manage access settings', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $this->actingAs($user)
        ->get(route('settings.access.edit'))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('settings.access.update'), ['open_registration_enabled' => true])
        ->assertForbidden();
});

function accessSettingsUser(): User
{
    $user = User::factory()->create(['is_approved' => true]);

    Permission::findOrCreate('system.settings.manage', 'web');
    $user->givePermissionTo('system.settings.manage');

    return $user;
}
