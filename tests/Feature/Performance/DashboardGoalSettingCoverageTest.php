<?php

use App\Models\AppraisalTemplate;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Organization;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\User;
use App\Services\Performance\DashboardGoalSettingCoverageService;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function goalSettingCoverageTenant(): array
{
    $organization = Organization::query()->firstOrFail();
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

    return [$organization, Location::query()->firstOrFail()];
}

test('dashboard exposes goal setting coverage for goal library viewers', function () {
    [$organization] = goalSettingCoverageTenant();
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo([
        Permission::findOrCreate('performance.dashboard.view', 'web'),
        Permission::findOrCreate('performance.goal_library.view', 'web'),
    ]);
    EmployeeProfile::factory()->for($user)->create([
        'is_active' => true,
        'is_review_eligible' => false,
    ]);

    $department = Department::factory()->create(['name' => 'Finance']);
    $jobTitle = JobTitle::factory()->create(['name' => 'Analyst']);
    $perspective = Perspective::factory()->create();
    $lineManager = User::factory()->create();
    $approvingManager = User::factory()->create();
    $employee = User::factory()->create(['name' => 'Blocked Employee']);

    EmployeeProfile::factory()->create([
        'user_id' => $employee->id,
        'employee_number' => 'GS-001',
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'location_id' => Location::query()->firstOrFail()->id,
        'line_manager_user_id' => $lineManager->id,
        'approving_manager_user_id' => $approvingManager->id,
        'is_active' => true,
        'is_review_eligible' => true,
    ]);

    GoalLibraryItem::factory()->count(3)->create([
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'perspective_id' => $perspective->id,
        'default_weight' => 33.33,
        'is_active' => true,
    ]);

    AppraisalTemplate::factory()->create([
        'name' => 'Corporate Template',
        'min_objectives' => 4,
        'max_objectives' => 6,
        'is_active' => true,
        'is_default' => true,
    ]);

    $this->actingAs($user)
        ->get(route('performance.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/dashboard/Index')
            ->has('goalSettingCoverage.organization', fn (Assert $org) => $org
                ->where('id', $organization->id)
                ->where('name', $organization->name)
                ->etc()
            )
            ->has('goalSettingCoverage.summary', fn (Assert $summary) => $summary
                ->where('eligible_employees', 1)
                ->where('blocked_scopes', 1)
                ->etc()
            )
            ->has('goalSettingCoverage.scopes', 1)
            ->where('goalSettingCoverage.scopes.0.status', 'blocked')
            ->where('goalSettingCoverage.scopes.0.department_name', 'Finance')
            ->where('goalSettingCoverage.scopes.0.job_title_name', 'Analyst')
            ->where('goalSettingCoverage.scopes.0.employee_count', 1)
        );
});

test('goal setting coverage service flags missing KPIs and invalid weights', function () {
    goalSettingCoverageTenant();

    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $perspective = Perspective::factory()->create();
    $lineManager = User::factory()->create();
    $approvingManager = User::factory()->create();
    $employee = User::factory()->create();

    EmployeeProfile::factory()->create([
        'user_id' => $employee->id,
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'location_id' => Location::query()->firstOrFail()->id,
        'line_manager_user_id' => $lineManager->id,
        'approving_manager_user_id' => $approvingManager->id,
        'is_active' => true,
        'is_review_eligible' => true,
    ]);

    GoalLibraryItem::factory()->create([
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'perspective_id' => $perspective->id,
        'default_weight' => 80,
        'is_active' => true,
    ]);

    $report = app(DashboardGoalSettingCoverageService::class)->report();
    $scope = collect($report['scopes'])->first();

    expect($scope['status'])->toBe('blocked')
        ->and($scope['issues'])->toContain('invalid_weights')
        ->and($scope['issues'])->toContain('below_minimum')
        ->and($scope['employees'])->toHaveCount(1);
});

test('goal setting coverage is hidden from users without goal library or review cycle access', function () {
    goalSettingCoverageTenant();
    $user = User::factory()->create(['is_approved' => true]);
    $user->givePermissionTo(Permission::findOrCreate('performance.dashboard.view', 'web'));
    EmployeeProfile::factory()->for($user)->create([
        'is_active' => true,
        'is_review_eligible' => false,
    ]);

    $this->actingAs($user)
        ->get(route('performance.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/dashboard/Index')
            ->where('goalSettingCoverage', null)
        );
});
