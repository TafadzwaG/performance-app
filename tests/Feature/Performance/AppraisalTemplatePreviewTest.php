<?php

use App\Models\AppraisalTemplate;
use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\User;
use App\Support\Branding;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('authorized users can preview template blade layout and inline pdf', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantTemplateViewPermission($user);

    $template = AppraisalTemplate::factory()->create([
        'name' => 'Executive Review Template',
        'code' => 'EXEC-01',
    ]);

    $this->actingAs($user)
        ->get(route('performance.templates.print', $template))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/templates/Print')
            ->where('template.id', $template->id)
            ->where('layoutBladePath', 'resources/views/pdf/performance/template-export.blade.php'));

    $this->actingAs($user)
        ->get(route('performance.templates.preview.layout', $template))
        ->assertOk()
        ->assertSee('Executive Review Template', false)
        ->assertSee('Performance Setup', false);

    $this->actingAs($user)
        ->get(route('performance.templates.print.pdf.inline', $template))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});

test('template layout preview uses latest company branding', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantTemplateViewPermission($user);

    $template = AppraisalTemplate::factory()->create([
        'name' => 'Branded Template',
    ]);

    $organization = app(TenantContext::class)->organization();
    $organization->update(['name' => 'Monomotapa Hotel Group']);
    $organization->settings()->updateOrCreate([], [
        'address_line_1' => '1 Sam Nujoma Street',
        'city' => 'Harare',
        'country' => 'Zimbabwe',
    ]);

    Branding::updateLogo(UploadedFile::fake()->image('company-logo.png', 240, 80));

    $response = $this->actingAs($user)
        ->get(route('performance.templates.preview.layout', $template));

    $response->assertOk()
        ->assertSee('Monomotapa Hotel Group', false)
        ->assertSee('1 Sam Nujoma Street', false)
        ->assertSee("branding/organizations/{$organization->id}", false);

    expect($response->headers->get('Cache-Control'))->toContain('no-store');
});

function grantTemplateViewPermission(User $user): void
{
    Permission::findOrCreate('performance.templates.view', 'web');
    $user->givePermissionTo('performance.templates.view');
    EmployeeProfile::factory()->for($user)->create();
}
