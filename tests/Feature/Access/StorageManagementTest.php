<?php

use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('browse lists all files in a storage zone recursively', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantStorageManagementPermission($user);

    Storage::disk('local')->deleteDirectory('imports');
    Storage::disk('local')->put('imports/employees/one.csv', 'a');
    Storage::disk('local')->put('imports/employees/nested/two.csv', 'b');

    $this->actingAs($user)
        ->get(route('access.storage.index', ['zone' => 'imports', 'list' => 'all']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('files.list_all', true)
            ->where('files.entries', function ($entries) {
                $paths = collect($entries)->pluck('path')->all();

                return in_array('employees/one.csv', $paths, true)
                    && in_array('employees/nested/two.csv', $paths, true);
            })
        );
});

test('authorized user can view storage management page', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantStorageManagementPermission($user);

    $this->actingAs($user)
        ->get(route('access.storage.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('access/storage/Index')
            ->has('storage.zones')
            ->has('files.entries')
        );
});

test('authorized user can download a managed file', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantStorageManagementPermission($user);

    Storage::disk('local')->put('imports/employees/report.csv', 'employee_number,name');

    $this->actingAs($user)
        ->get(route('access.storage.download', ['zone' => 'imports', 'path' => 'employees/report.csv']))
        ->assertOk()
        ->assertDownload('report.csv');
});

test('authorized user can delete a file from storage management', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantStorageManagementPermission($user);

    Storage::disk('local')->put('imports/employees/remove-me.csv', 'data');

    $this->actingAs($user)
        ->delete(route('access.storage.files.destroy'), [
            'zone' => 'imports',
            'path' => 'employees/remove-me.csv',
        ])
        ->assertRedirect(route('access.storage.index', ['zone' => 'imports', 'path' => 'employees']));

    expect(Storage::disk('local')->exists('imports/employees/remove-me.csv'))->toBeFalse();
});

test('system settings manager can access storage without dedicated storage permission', function () {
    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('system.settings.manage', 'web');
    $user->givePermissionTo('system.settings.manage');

    $this->actingAs($user)
        ->get(route('access.storage.index'))
        ->assertOk();
});

test('users without storage or settings permission cannot access storage management', function () {
    $user = User::factory()->create(['is_approved' => true]);
    EmployeeProfile::factory()->for($user)->create();

    $this->actingAs($user)
        ->get(route('access.storage.index'))
        ->assertForbidden();
});

test('authorized user can purge an export storage zone', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantStorageManagementPermission($user);

    $directory = storage_path('app/exports');

    if (! File::isDirectory($directory)) {
        File::makeDirectory($directory, 0755, true);
    }

    File::put($directory.'/purge-me.xlsx', 'content');

    $this->actingAs($user)
        ->delete(route('access.storage.purge', ['zone' => 'exports']))
        ->assertRedirect(route('access.storage.index', ['zone' => 'exports', 'list' => 'all']));

    expect(File::exists($directory.'/purge-me.xlsx'))->toBeFalse();
});

function grantStorageManagementPermission(User $user): void
{
    Permission::findOrCreate('access.storage.manage', 'web');
    $user->givePermissionTo('access.storage.manage');
}
