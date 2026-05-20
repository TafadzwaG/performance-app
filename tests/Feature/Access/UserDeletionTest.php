<?php

use App\Models\Appraisal;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('authorized user can preview deletion impact for another user', function () {
    $actor = createUserWithDeletePermission();
    $target = User::factory()->create(['is_approved' => true]);
    $profile = EmployeeProfile::factory()->for($target)->create();
    Appraisal::factory()->for($profile, 'employeeProfile')->for($target, 'employee')->create();

    $response = $this->actingAs($actor)
        ->getJson(route('access.users.deletion_impact', $target))
        ->assertOk()
        ->assertJsonPath('user.id', $target->id);

    $appraisalItem = collect($response->json('items'))->firstWhere('key', 'appraisals');

    expect($appraisalItem['count'] ?? 0)->toBe(1);
});

test('authorized user can delete another user with password confirmation', function () {
    $actor = createUserWithDeletePermission('Confirm@Password1');
    $target = User::factory()->create(['is_approved' => true, 'email' => 'delete-me@example.test']);
    EmployeeProfile::factory()->for($target)->create();

    $this->actingAs($actor)
        ->delete(route('access.users.destroy', $target), [
            'current_password' => 'Confirm@Password1',
        ])
        ->assertRedirect(route('access.users.index'));

    expect(User::query()->whereKey($target->id)->exists())->toBeFalse();
});

test('user deletion requires the actor current password', function () {
    $actor = createUserWithDeletePermission('Confirm@Password1');
    $target = User::factory()->create(['is_approved' => true]);

    $this->actingAs($actor)
        ->from(route('access.users.index'))
        ->delete(route('access.users.destroy', $target), [
            'current_password' => 'wrong-password',
        ])
        ->assertRedirect(route('access.users.index'))
        ->assertSessionHasErrors('current_password');

    expect(User::query()->whereKey($target->id)->exists())->toBeTrue();
});

test('users cannot delete their own account', function () {
    $actor = createUserWithDeletePermission('Confirm@Password1');

    $this->actingAs($actor)
        ->delete(route('access.users.destroy', $actor), [
            'current_password' => 'Confirm@Password1',
        ])
        ->assertForbidden();

    expect(User::query()->whereKey($actor->id)->exists())->toBeTrue();
});

test('users without delete permission cannot remove accounts', function () {
    $actor = User::factory()->create([
        'is_approved' => true,
        'password' => Hash::make('Confirm@Password1'),
    ]);
    Permission::findOrCreate('access.users.view', 'web');
    $actor->givePermissionTo('access.users.view');

    $target = User::factory()->create(['is_approved' => true]);

    $this->actingAs($actor)
        ->delete(route('access.users.destroy', $target), [
            'current_password' => 'Confirm@Password1',
        ])
        ->assertForbidden();
});

function createUserWithDeletePermission(string $password = 'password'): User
{
    $user = User::factory()->create([
        'is_approved' => true,
        'password' => Hash::make($password),
    ]);

    Permission::findOrCreate('access.users.delete', 'web');
    $user->givePermissionTo('access.users.delete');

    return $user;
}
