<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Notifications\Access\UserOnboardingNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('authorized admin can create a user and send onboarding credentials', function () {
    $admin = User::factory()->create();
    $employeeRole = Role::findOrCreate('Employee', 'web');

    grantUserAccessPermissions($admin, ['access.users.create']);

    Notification::fake();

    $response = $this->actingAs($admin)->post(route('access.users.store'), [
        'name' => 'Rumbidzai Mlambo',
        'email' => 'rumbidzai.mlambo@example.com',
        'password' => '',
        'password_confirmation' => '',
        'send_credentials_email' => true,
        'force_password_change' => true,
        'role_ids' => [$employeeRole->id],
        'permission_ids' => [],
    ]);

    $user = User::query()->where('email', 'rumbidzai.mlambo@example.com')->firstOrFail();

    $response->assertRedirect(route('access.users.show', $user));

    expect($user->force_password_change)->toBeTrue();
    expect($user->password_changed_at)->toBeNull();
    expect($user->hasRole($employeeRole))->toBeTrue();

    Notification::assertSentTo($user, UserOnboardingNotification::class, function (UserOnboardingNotification $notification) {
        return $notification->forcePasswordChange
            && $notification->plainPassword !== '';
    });
});

test('authorized admin can bulk create users with shared access assignments', function () {
    $admin = User::factory()->create();
    $employeeRole = Role::findOrCreate('Employee', 'web');
    $reportPermission = Permission::findOrCreate('performance.reports.view', 'web');

    grantUserAccessPermissions($admin, ['access.users.create']);

    $response = $this->actingAs($admin)->post(route('access.users.bulk_store'), [
        'default_role_ids' => [$employeeRole->id],
        'default_permission_ids' => [$reportPermission->id],
        'users' => [
            [
                'name' => 'Tatenda Muchengeti',
                'email' => 'tatenda.muchengeti@example.com',
                'password' => '',
                'send_credentials_email' => false,
                'force_password_change' => true,
            ],
            [
                'name' => 'Nyasha Makoni',
                'email' => 'nyasha.makoni@example.com',
                'password' => '',
                'send_credentials_email' => false,
                'force_password_change' => true,
            ],
        ],
    ]);

    $response
        ->assertRedirect(route('access.users.index'))
        ->assertSessionHas('generated_credentials');

    $tatenda = User::query()->where('email', 'tatenda.muchengeti@example.com')->firstOrFail();
    $nyasha = User::query()->where('email', 'nyasha.makoni@example.com')->firstOrFail();

    expect($tatenda->hasRole($employeeRole))->toBeTrue();
    expect($nyasha->can('performance.reports.view'))->toBeTrue();
});

test('authorized admin can import users from a csv file', function () {
    $admin = User::factory()->create();
    $employeeRole = Role::findOrCreate('Employee', 'web');
    $managerRole = Role::findOrCreate('Manager', 'web');
    $reportPermission = Permission::findOrCreate('performance.reports.view', 'web');

    grantUserAccessPermissions($admin, ['access.users.import']);

    $csv = implode("\n", [
        'name,email,password,force_password_change,send_credentials_email,role_names,permission_names',
        'Ropafadzo Biti,ropafadzo.biti@example.com,,yes,no,,',
        'Tariro Gumbie,tariro.gumbie@example.com,Password@123,no,no,"Manager","performance.reports.view"',
    ]);

    $file = UploadedFile::fake()->createWithContent('users.csv', $csv);

    $response = $this->actingAs($admin)->post(route('access.users.import.store'), [
        'file' => $file,
        'default_role_ids' => [$employeeRole->id],
        'default_permission_ids' => [],
        'default_force_password_change' => true,
        'default_send_credentials_email' => false,
    ]);

    $response->assertRedirect(route('access.users.index'));

    $ropafadzo = User::query()->where('email', 'ropafadzo.biti@example.com')->firstOrFail();
    $tariro = User::query()->where('email', 'tariro.gumbie@example.com')->firstOrFail();

    expect($ropafadzo->hasRole($employeeRole))->toBeTrue();
    expect($tariro->hasRole($managerRole))->toBeTrue();
    expect($tariro->can('performance.reports.view'))->toBeTrue();
});

test('user with forced password change is redirected until the password is updated', function () {
    $user = User::factory()->create([
        'password' => Hash::make('Welcome@1234'),
        'force_password_change' => true,
        'password_changed_at' => null,
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'Welcome@1234',
    ])->assertRedirect(route('password.edit'));

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('password.edit'));

    $this->actingAs($user)
        ->put(route('password.update'), [
            'current_password' => 'Welcome@1234',
            'password' => 'NewWelcome@1234',
            'password_confirmation' => 'NewWelcome@1234',
        ])
        ->assertRedirect(route('employee-profile.complete'));

    $user->refresh();

    expect($user->force_password_change)->toBeFalse();
    expect($user->password_changed_at)->not()->toBeNull();
    expect(Hash::check('NewWelcome@1234', $user->password))->toBeTrue();
});

function grantUserAccessPermissions(User $user, array $permissions): void
{
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);
}
