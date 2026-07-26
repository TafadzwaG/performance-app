<?php

use App\Models\EmployeeProfile;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('employee appraisal lookup returns all matching active employees', function () {
    $admin = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.review_cycles.assign_employees', 'web');
    $admin->givePermissionTo('performance.review_cycles.assign_employees');
    EmployeeProfile::factory()->for($admin)->create();

    $profiles = collect(range(1, 30))->map(function (int $index) {
        $user = User::factory()->create([
            'name' => sprintf('Lookup Employee %02d', $index),
            'email' => sprintf('lookup.employee.%02d@example.test', $index),
            'is_approved' => true,
        ]);

        return EmployeeProfile::factory()
            ->for($user)
            ->create([
                'employee_number' => sprintf('LOOK%03d', $index),
                'is_active' => true,
            ]);
    });

    $response = $this
        ->actingAs($admin)
        ->getJson(route('performance.appraisals.lookup.employees', ['q' => 'Lookup Employee']));

    $response
        ->assertOk()
        ->assertJsonCount(30, 'results');

    expect(collect($response->json('results'))->pluck('value')->all())
        ->toEqual($profiles->pluck('id')->all());
});
