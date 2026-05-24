<?php

use App\Exports\Performance\EmployeeProfilesExport;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\Settings\MailSettingsService;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Inertia\Testing\AssertableInertia as Assert;
use OpenSpout\Reader\XLSX\Reader;

uses(RefreshDatabase::class);

test('super admin role can view system settings', function () {
    $this->seed(PermissionSeeder::class);
    $this->seed(RoleSeeder::class);

    $user = User::factory()->create(['is_approved' => true]);
    $user->assignRole('Super Admin');

    expect($user->can('system.settings.manage'))->toBeTrue();

    $this->actingAs($user)
        ->get(route('settings.index'))
        ->assertOk();
});

test('system settings page shows company and smtp settings without exposing smtp password', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantSystemSettingsPermission($user);

    SystemSetting::query()->create([
        'company_name' => 'Nhaka Performance Group',
        'company_email' => 'people@nhaka.test',
        'smtp_host' => 'smtp.nhaka.test',
        'smtp_port' => 587,
        'smtp_username' => 'mailer',
        'smtp_password' => 'secret-password',
        'smtp_encryption' => 'tls',
        'mail_from_address' => 'notifications@nhaka.test',
        'mail_from_name' => 'Nhaka Notifications',
        'mail_notifications_enabled' => true,
    ]);

    $this->actingAs($user)
        ->get(route('settings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/index')
            ->has('operations.queue')
            ->has('operations.storage')
            ->where('settings.company_name', 'Nhaka Performance Group')
            ->where('settings.company_email', 'people@nhaka.test')
            ->where('settings.smtp_host', 'smtp.nhaka.test')
            ->where('settings.smtp_password', '')
            ->where('settings.smtp_password_set', true)
            ->where('settings.mail_notifications_enabled', true)
        );
});

test('system settings update persists company profile and encrypted smtp settings', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantSystemSettingsPermission($user);

    $this->actingAs($user)
        ->put(route('settings.update'), [
            'company_name' => 'TJT Appraisals',
            'company_legal_name' => 'TJT Appraisals Private Limited',
            'company_registration_number' => 'REG-123',
            'company_tax_number' => 'TAX-456',
            'company_email' => 'hr@tjt.test',
            'company_phone' => '+263 77 000 0000',
            'company_website' => 'https://tjt.test',
            'address_line_1' => '12 First Street',
            'address_line_2' => 'Suite 4',
            'city' => 'Harare',
            'state_province' => 'Harare',
            'postal_code' => '0000',
            'country' => 'Zimbabwe',
            'report_footer' => 'Confidential performance report.',
            'smtp_host' => 'smtp.tjt.test',
            'smtp_port' => 2525,
            'smtp_username' => 'smtp-user',
            'smtp_password' => 'smtp-secret',
            'smtp_encryption' => 'tls',
            'mail_from_address' => 'notifications@tjt.test',
            'mail_from_name' => 'TJT Notifications',
            'mail_reply_to_address' => 'reply@tjt.test',
            'mail_reply_to_name' => 'TJT HR',
            'mail_notifications_enabled' => true,
        ])
        ->assertRedirect(route('settings.index'));

    $settings = SystemSetting::query()->firstOrFail();

    expect($settings->company_name)->toBe('TJT Appraisals')
        ->and($settings->company_legal_name)->toBe('TJT Appraisals Private Limited')
        ->and($settings->smtp_host)->toBe('smtp.tjt.test')
        ->and($settings->smtp_password)->toBe('smtp-secret')
        ->and($settings->getRawOriginal('smtp_password'))->not->toBe('smtp-secret')
        ->and($settings->mail_notifications_enabled)->toBeTrue();
});

test('mail settings service applies smtp settings from database at runtime', function () {
    SystemSetting::query()->create([
        'smtp_host' => 'smtp.runtime.test',
        'smtp_port' => 465,
        'smtp_username' => 'runtime-user',
        'smtp_password' => 'runtime-secret',
        'smtp_encryption' => 'ssl',
        'mail_from_address' => 'runtime@example.test',
        'mail_from_name' => 'Runtime Mail',
        'mail_reply_to_address' => 'reply@example.test',
        'mail_reply_to_name' => 'Reply Runtime',
        'mail_notifications_enabled' => true,
    ]);

    app(MailSettingsService::class)->apply();

    expect(Config::get('mail.default'))->toBe('smtp')
        ->and(Config::get('mail.mailers.smtp.host'))->toBe('smtp.runtime.test')
        ->and(Config::get('mail.mailers.smtp.port'))->toBe(465)
        ->and(Config::get('mail.mailers.smtp.username'))->toBe('runtime-user')
        ->and(Config::get('mail.mailers.smtp.password'))->toBe('runtime-secret')
        ->and(Config::get('mail.from.address'))->toBe('runtime@example.test')
        ->and(Config::get('mail.reply_to.address'))->toBe('reply@example.test');
});

test('employee export includes configured company identity above headings', function () {
    SystemSetting::query()->create([
        'company_name' => 'Nhaka Performance Group',
        'address_line_1' => '12 First Street',
        'city' => 'Harare',
        'country' => 'Zimbabwe',
        'report_footer' => 'Confidential performance report.',
    ]);

    $profile = EmployeeProfile::factory()->create(['employee_number' => 'EMP-SET-001']);
    $response = (new EmployeeProfilesExport(collect([$profile->load(['user'])]), ['user_name', 'employee_number']))
        ->download('settings-company-export.xlsx');

    $reader = new Reader;
    $reader->open($response->getFile()->getPathname());

    $rows = [];

    foreach ($reader->getSheetIterator() as $sheet) {
        foreach ($sheet->getRowIterator() as $row) {
            $rows[] = $row->toArray();
        }

        break;
    }

    $reader->close();

    expect($rows[0][0])->toBe('Nhaka Performance Group')
        ->and($rows[1][0])->toBe('12 First Street, Harare, Zimbabwe')
        ->and($rows[2])->toBe(['Employee Name', 'Employee Number'])
        ->and($rows[3][1])->toBe('EMP-SET-001')
        ->and($rows[4][0])->toBe('Confidential performance report.');
});

test('authorized users can upload and reset the company logo from settings', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantSystemSettingsPermission($user);

    $logo = UploadedFile::fake()->image('company-logo.png', 240, 80);

    $this->actingAs($user)
        ->post(route('settings.logo.update'), ['logo' => $logo])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(glob(public_path('branding/system-logo.*')) ?: [])->not->toBeEmpty();

    $this->actingAs($user)
        ->delete(route('settings.logo.destroy'))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(glob(public_path('branding/system-logo.*')) ?: [])->toBeEmpty();
});

test('users without settings permission cannot upload company logo', function () {
    $user = User::factory()->create(['is_approved' => true]);
    $logo = UploadedFile::fake()->image('company-logo.png');

    $this->actingAs($user)
        ->post(route('settings.logo.update'), ['logo' => $logo])
        ->assertForbidden();
});

function grantSystemSettingsPermission(User $user): void
{
    Permission::findOrCreate('system.settings.manage', 'web');
    $user->givePermissionTo('system.settings.manage');
}
