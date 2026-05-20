<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('system settings operations tab includes queue and storage summary', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantSystemSettingsPermission($user);

    DB::table('jobs')->insert([
        'queue' => 'default',
        'payload' => json_encode([
            'displayName' => 'App\\Mail\\UserApprovedNotification',
            'job' => 'Illuminate\\Queue\\CallQueuedHandler@call',
            'data' => ['commandName' => 'App\\Mail\\UserApprovedNotification'],
        ]),
        'attempts' => 0,
        'reserved_at' => null,
        'available_at' => now()->timestamp,
        'created_at' => now()->timestamp,
    ]);

    $this->actingAs($user)
        ->get(route('settings.index', ['tab' => 'operations']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/index')
            ->has('operations.queue')
            ->has('operations.storage')
            ->where('operations.queue.pending_count', 1)
        );
});

test('authorized user can delete a pending queue job from settings operations', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantSystemSettingsPermission($user);

    $jobId = DB::table('jobs')->insertGetId([
        'queue' => 'default',
        'payload' => json_encode(['displayName' => 'TestJob']),
        'attempts' => 0,
        'reserved_at' => null,
        'available_at' => now()->timestamp,
        'created_at' => now()->timestamp,
    ]);

    $this->actingAs($user)
        ->delete(route('settings.operations.pending_jobs.destroy', ['job' => $jobId]))
        ->assertRedirect(route('settings.index', ['tab' => 'operations']));

    expect(DB::table('jobs')->count())->toBe(0);
});

test('storage file actions use the storage management routes', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantSystemSettingsPermission($user);

    Storage::disk('local')->put('imports/employees/test.csv', 'employee_number,name');

    $this->actingAs($user)
        ->delete(route('access.storage.files.destroy'), [
            'zone' => 'imports',
            'path' => 'employees/test.csv',
        ])
        ->assertRedirect();

    expect(Storage::disk('local')->exists('imports/employees/test.csv'))->toBeFalse();
});

test('authorized user can purge export storage from storage management route', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantSystemSettingsPermission($user);

    $directory = storage_path('app/exports');

    if (! File::isDirectory($directory)) {
        File::makeDirectory($directory, 0755, true);
    }

    File::put($directory.'/sample.xlsx', 'content');

    $this->actingAs($user)
        ->delete(route('access.storage.purge', ['zone' => 'exports']))
        ->assertRedirect(route('access.storage.index', ['zone' => 'exports']));

    expect(File::exists($directory.'/sample.xlsx'))->toBeFalse();
});

test('users without system settings permission cannot manage operations', function () {
    $user = User::factory()->create(['is_approved' => true]);

    $this->actingAs($user)
        ->delete(route('access.storage.files.destroy'), [
            'zone' => 'imports',
            'path' => 'employees/test.csv',
        ])
        ->assertForbidden();
});
