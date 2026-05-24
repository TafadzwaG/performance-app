<?php

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use OpenSpout\Reader\XLSX\Reader;

uses(RefreshDatabase::class);

test('goal library index filters by department job title and perspective', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryViewPermissions($user);

    $finance = Department::factory()->create(['name' => 'Finance']);
    $operations = Department::factory()->create(['name' => 'Operations']);
    $analyst = JobTitle::factory()->create(['name' => 'Analyst']);
    $manager = JobTitle::factory()->create(['name' => 'Manager']);
    $financial = Perspective::factory()->create(['name' => 'Financial']);
    $customer = Perspective::factory()->create(['name' => 'Customer']);

    $matching = GoalLibraryItem::factory()
        ->for($finance)
        ->for($analyst)
        ->for($financial)
        ->create(['title' => 'Finance analyst revenue goal']);

    GoalLibraryItem::factory()
        ->for($operations)
        ->for($manager)
        ->for($customer)
        ->create(['title' => 'Operations manager service goal']);

    $this->actingAs($user)
        ->get(route('performance.goal_library.index', [
            'department_id' => $finance->id,
            'job_title_id' => $analyst->id,
            'perspective_id' => $financial->id,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('performance/goal-library/Index')
            ->has('goalLibraryItems.data', 1)
            ->where('goalLibraryItems.data.0.id', $matching->id)
            ->where('filters.department_id', (string) $finance->id)
            ->where('filters.job_title_id', (string) $analyst->id)
            ->where('filters.perspective_id', (string) $financial->id));
});

test('authorized users can delete goal library items', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryViewPermissions($user);
    Permission::findOrCreate('performance.goal_library.archive', 'web');
    $user->givePermissionTo('performance.goal_library.archive');

    $goal = GoalLibraryItem::factory()->create(['title' => 'Legacy revenue goal']);

    $this->actingAs($user)
        ->delete(route('performance.goal_library.destroy', $goal))
        ->assertRedirect(route('performance.goal_library.index'));

    $this->assertSoftDeleted('goal_library_items', ['id' => $goal->id]);
});

test('users without archive permission cannot delete goal library items', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryViewPermissions($user);

    $goal = GoalLibraryItem::factory()->create();

    $this->actingAs($user)
        ->delete(route('performance.goal_library.destroy', $goal))
        ->assertForbidden();

    $this->assertDatabaseHas('goal_library_items', ['id' => $goal->id, 'deleted_at' => null]);
});

test('authorized users can export filtered goal library items', function () {
    $user = User::factory()->create(['is_approved' => true]);
    grantGoalLibraryViewPermissions($user);

    $finance = Department::factory()->create(['name' => 'Finance']);
    $operations = Department::factory()->create(['name' => 'Operations']);
    $analyst = JobTitle::factory()->create(['name' => 'Analyst']);
    $financial = Perspective::factory()->create(['name' => 'Financial']);

    GoalLibraryItem::factory()
        ->for($finance)
        ->for($analyst)
        ->for($financial)
        ->create([
            'title' => 'Finance analyst revenue goal',
            'kpi_measure' => 'Monthly revenue',
            'target_definition' => 'Reach 1M',
            'default_weight' => 20,
            'evidence_source' => 'ERP report',
            'is_active' => true,
        ]);

    GoalLibraryItem::factory()
        ->for($operations)
        ->for($financial)
        ->create(['title' => 'Operations efficiency goal']);

    $response = $this->actingAs($user)->get(route('performance.goal_library.export', [
        'department_id' => $finance->id,
        'job_title_id' => $analyst->id,
        'perspective_id' => $financial->id,
    ]));

    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('goal-library-');

    $reader = new Reader;
    $reader->open($response->baseResponse->getFile()->getPathname());

    $rows = [];

    foreach ($reader->getSheetIterator() as $sheet) {
        foreach ($sheet->getRowIterator() as $row) {
            $rows[] = $row->toArray();
        }
    }

    $reader->close();

    $dataRows = collect($rows)
        ->filter(fn (array $row) => in_array('Finance analyst revenue goal', $row, true))
        ->values();

    expect($dataRows)->toHaveCount(1);
    expect($dataRows[0])->toContain('Financial');
    expect($dataRows[0])->toContain('Finance');
    expect($dataRows[0])->toContain('Analyst');
    expect($dataRows[0])->toContain('Yes');

    $flatRows = collect($rows)->flatten()->filter()->values();
    expect($flatRows->contains('§ GOAL LIBRARY'))->toBeTrue();
    expect($flatRows->contains('Perspective'))->toBeTrue();
    expect($flatRows->contains('Finance'))->toBeTrue();
});

test('goal library index table uses kpi naming conventions', function () {
    $index = file_get_contents(resource_path('js/pages/performance/goal-library/Index.tsx'));

    expect($index)
        ->toContain('Perspective')
        ->toContain('Objective (The Goal)')
        ->toContain('KPI / Measure (How Measured)')
        ->toContain('Target (Success Definition)')
        ->toContain('Weight')
        ->toContain('Evidence Source');
});

function grantGoalLibraryViewPermissions(User $user): void
{
    Permission::findOrCreate('performance.goal_library.view', 'web');
    Permission::findOrCreate('performance.goal_library.update', 'web');
    $user->givePermissionTo(['performance.goal_library.view', 'performance.goal_library.update']);
    EmployeeProfile::factory()->for($user)->create();
}
