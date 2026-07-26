<?php

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Models\AppraisalTemplate;
use App\Models\Competency;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Organization;
use App\Models\Permission;
use App\Models\Perspective;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Notifications\Performance\AppraisalSelfAssessmentReadyNotification;
use App\Services\Performance\AppraisalNavigationService;
use App\Services\Performance\ReviewCycleAutomationService;
use App\Tenancy\TenantContext;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\PermissionRegistrar;

function automaticKpiTenantContext(): array
{
    $organization = Organization::query()->firstOrFail();
    app(TenantContext::class)->set($organization);
    app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

    return [$organization, Location::query()->firstOrFail()];
}

function automaticKpiTemplate(): AppraisalTemplate
{
    return AppraisalTemplate::factory()->create([
        'min_objectives' => 4,
        'max_objectives' => 6,
        'is_active' => true,
    ]);
}

function automaticKpiCycle(AppraisalTemplate $template, array $overrides = []): ReviewCycle
{
    return ReviewCycle::factory()->create(array_merge([
        'template_id' => $template->id,
        'status' => ReviewCycleStatus::Draft,
        'start_date' => '2026-08-01',
        'end_date' => '2026-12-31',
    ], $overrides));
}

function automaticKpiProfile(
    Department $department,
    JobTitle $jobTitle,
    User $lineManager,
    User $approvingManager,
    Location $location,
    string $suffix,
): EmployeeProfile {
    $employee = User::factory()->create(['name' => "Employee {$suffix}"]);

    return EmployeeProfile::factory()->create([
        'user_id' => $employee->id,
        'employee_number' => "AUTO-{$suffix}",
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'location_id' => $location->id,
        'line_manager_user_id' => $lineManager->id,
        'approving_manager_user_id' => $approvingManager->id,
        'review_eligibility_date' => null,
        'is_review_eligible' => true,
        'is_active' => true,
    ]);
}

function automaticKpis(Department $department, JobTitle $jobTitle): array
{
    $perspective = Perspective::factory()->create();
    $timelines = [10, 90, null, 999];

    return collect($timelines)->map(function (?int $timeline, int $index) use ($department, $jobTitle, $perspective) {
        return GoalLibraryItem::factory()->create([
            'department_id' => $department->id,
            'job_title_id' => $jobTitle->id,
            'perspective_id' => $perspective->id,
            'title' => 'KPI '.($index + 1),
            'kpi_measure' => 'Measure '.($index + 1),
            'target_definition' => 'Target '.($index + 1),
            'default_weight' => 25,
            'evidence_source' => 'Evidence '.($index + 1),
            'timeline_days' => $timeline,
            'is_active' => true,
        ]);
    })->all();
}

test('opening a cycle atomically snapshots My KPIs for every eligible employee', function () {
    Notification::fake();
    [, $location] = automaticKpiTenantContext();
    $actor = User::factory()->create(['name' => 'Organization Admin']);
    $lineManager = User::factory()->create(['name' => 'Line Manager']);
    $approvingManager = User::factory()->create(['name' => 'Approving Manager']);
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $kpis = automaticKpis($department, $jobTitle);
    $template = automaticKpiTemplate();
    $competency = Competency::query()->create([
        'name' => 'Customer focus',
        'code' => 'AUTO-CUSTOMER-FOCUS',
        'category' => 'competency',
        'is_active' => true,
    ]);
    $template->items()->create([
        'item_type' => 'competency',
        'competency_id' => $competency->id,
        'title' => $competency->name,
        'sort_order' => 1,
        'is_required' => true,
    ]);
    $cycle = automaticKpiCycle($template);
    $profiles = collect(range(1, 30))->map(fn (int $index) => automaticKpiProfile(
        $department,
        $jobTitle,
        $lineManager,
        $approvingManager,
        $location,
        str_pad((string) $index, 2, '0', STR_PAD_LEFT),
    ));

    $readiness = app(ReviewCycleAutomationService::class)->readiness($cycle);

    expect($readiness)->toMatchArray([
        'ready' => true,
        'eligible' => 30,
        'existing' => 0,
        'to_create' => 30,
        'objective_count' => 120,
    ]);

    app(ReviewCycleAutomationService::class)->open($cycle, $actor);

    expect($cycle->refresh()->status)->toBe(ReviewCycleStatus::Open)
        ->and(Appraisal::query()->count())->toBe(30)
        ->and(Appraisal::query()->where('status', AppraisalStatus::SelfAssessmentPending->value)->count())->toBe(30)
        ->and(Appraisal::query()->whereNull('goal_submitted_at')->count())->toBe(0);

    $appraisal = Appraisal::query()->where('employee_profile_id', $profiles->first()->id)->firstOrFail();
    $objectives = $appraisal->objectives()->get();

    expect($objectives)->toHaveCount(4)
        ->and((float) $objectives->sum('weight'))->toBe(100.0)
        ->and($objectives->pluck('goal_library_item_id')->all())->toBe(collect($kpis)->pluck('id')->all())
        ->and($objectives[0]->title)->toBe('KPI 1')
        ->and($objectives[0]->due_date->toDateString())->toBe('2026-08-11')
        ->and($objectives[2]->due_date->toDateString())->toBe('2026-12-31')
        ->and($objectives[3]->due_date->toDateString())->toBe('2026-12-31')
        ->and($appraisal->approvals()->count())->toBe(1)
        ->and($appraisal->statusHistories()->count())->toBe(1)
        ->and($appraisal->competencyRatings()->count())->toBe(1)
        ->and($appraisal->approvals()->first()->snapshot['source'])->toBe('my_kpis');

    $employee = $profiles->first()->user;
    foreach (['performance.appraisals.view_own', 'performance.appraisals.plan_own', 'performance.appraisals.self_assess'] as $permissionName) {
        Permission::findOrCreate($permissionName, 'web');
        $employee->givePermissionTo($permissionName);
    }

    expect($employee->can('plan', $appraisal))->toBeFalse()
        ->and($employee->can('selfAssess', $appraisal))->toBeTrue()
        ->and(app(AppraisalNavigationService::class)->continueRoute($appraisal, $employee))
        ->toBe(route('performance.appraisals.self_assessment', $appraisal));

    Notification::assertSentTo(
        $profiles->map->user,
        AppraisalSelfAssessmentReadyNotification::class,
    );
});

test('one employee readiness blocker rolls back the entire cycle opening', function () {
    Notification::fake();
    [, $location] = automaticKpiTenantContext();
    $actor = User::factory()->create();
    $lineManager = User::factory()->create();
    $approvingManager = User::factory()->create();
    $department = Department::factory()->create();
    $readyJob = JobTitle::factory()->create();
    $blockedJob = JobTitle::factory()->create();
    automaticKpis($department, $readyJob);
    automaticKpiProfile($department, $readyJob, $lineManager, $approvingManager, $location, 'READY');
    $blocked = automaticKpiProfile($department, $blockedJob, $lineManager, $approvingManager, $location, 'BLOCKED');
    $cycle = automaticKpiCycle(automaticKpiTemplate());

    $readiness = app(ReviewCycleAutomationService::class)->readiness($cycle);

    expect($readiness['ready'])->toBeFalse()
        ->and(collect($readiness['blockers'])->pluck('employee_profile_id'))->toContain($blocked->id)
        ->and($readiness['template'])->toMatchArray([
            'name' => $cycle->template->name,
            'min_objectives' => 4,
            'max_objectives' => 6,
        ]);

    $blockedEntry = collect($readiness['blockers'])->firstWhere('employee_profile_id', $blocked->id);
    expect($blockedEntry)->not->toBeNull()
        ->and($blockedEntry['matching_kpis'])->toBeArray()
        ->and($blockedEntry['kpi_weight_total'])->toBe(0.0);

    expect(fn () => app(ReviewCycleAutomationService::class)->open($cycle, $actor))
        ->toThrow(ValidationException::class);

    expect($cycle->refresh()->status)->toBe(ReviewCycleStatus::Draft)
        ->and(Appraisal::query()->count())->toBe(0);
    Notification::assertNothingSent();
});

test('readiness blocks employees with fewer KPIs than the selected template requires', function () {
    Notification::fake();
    [, $location] = automaticKpiTenantContext();
    $lineManager = User::factory()->create();
    $approvingManager = User::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $perspective = Perspective::factory()->create();

    GoalLibraryItem::factory()->create([
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'perspective_id' => $perspective->id,
        'title' => 'KPI 1',
        'default_weight' => 34,
        'is_active' => true,
    ]);
    GoalLibraryItem::factory()->create([
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'perspective_id' => $perspective->id,
        'title' => 'KPI 2',
        'default_weight' => 33,
        'is_active' => true,
    ]);
    GoalLibraryItem::factory()->create([
        'department_id' => $department->id,
        'job_title_id' => $jobTitle->id,
        'perspective_id' => $perspective->id,
        'title' => 'KPI 3',
        'default_weight' => 33,
        'is_active' => true,
    ]);

    automaticKpiProfile($department, $jobTitle, $lineManager, $approvingManager, $location, 'UNDER');
    $template = automaticKpiTemplate();
    $cycle = automaticKpiCycle($template);

    $readiness = app(ReviewCycleAutomationService::class)->readiness($cycle);

    expect($readiness['ready'])->toBeFalse()
        ->and($readiness['template']['min_objectives'])->toBe(4)
        ->and(collect($readiness['blockers'])->first()['reasons'])->toContain('At least 4 KPIs are required by the selected template.');
});

test('sync adds only missing employees and never refreshes an existing KPI snapshot', function () {
    Notification::fake();
    [, $location] = automaticKpiTenantContext();
    $actor = User::factory()->create();
    $lineManager = User::factory()->create();
    $approvingManager = User::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    $kpis = automaticKpis($department, $jobTitle);
    $cycle = automaticKpiCycle(automaticKpiTemplate());
    $firstProfile = automaticKpiProfile($department, $jobTitle, $lineManager, $approvingManager, $location, 'FIRST');

    $service = app(ReviewCycleAutomationService::class);
    $service->open($cycle, $actor);
    $firstAppraisal = Appraisal::query()->where('employee_profile_id', $firstProfile->id)->firstOrFail();

    $kpis[0]->update(['title' => 'Updated KPI after opening']);
    $secondProfile = automaticKpiProfile($department, $jobTitle, $lineManager, $approvingManager, $location, 'SECOND');

    $firstSync = $service->sync($cycle, $actor);
    $secondSync = $service->sync($cycle, $actor);
    $secondAppraisal = Appraisal::query()->where('employee_profile_id', $secondProfile->id)->firstOrFail();

    expect($firstSync['created'])->toBe(1)
        ->and($secondSync['created'])->toBe(0)
        ->and($firstAppraisal->objectives()->orderBy('sort_order')->first()->title)->toBe('KPI 1')
        ->and($secondAppraisal->objectives()->where('goal_library_item_id', $kpis[0]->id)->first()->title)->toBe('Updated KPI after opening')
        ->and(Appraisal::query()->count())->toBe(2)
        ->and($firstAppraisal->approvals()->count())->toBe(1)
        ->and($secondAppraisal->approvals()->count())->toBe(1);
});

test('opening replaces an unstarted assignment with the selected template and KPI snapshot', function () {
    Notification::fake();
    [, $location] = automaticKpiTenantContext();
    $actor = User::factory()->create();
    $lineManager = User::factory()->create();
    $approvingManager = User::factory()->create();
    $department = Department::factory()->create();
    $jobTitle = JobTitle::factory()->create();
    automaticKpis($department, $jobTitle);
    $selectedTemplate = automaticKpiTemplate();
    $oldTemplate = automaticKpiTemplate();
    $cycle = automaticKpiCycle($selectedTemplate);
    $profile = automaticKpiProfile($department, $jobTitle, $lineManager, $approvingManager, $location, 'EXISTING');
    $existing = Appraisal::factory()->create([
        'review_cycle_id' => $cycle->id,
        'employee_profile_id' => $profile->id,
        'template_id' => $oldTemplate->id,
        'employee_user_id' => $profile->user_id,
        'line_manager_user_id' => $lineManager->id,
        'approving_manager_user_id' => $approvingManager->id,
        'status' => AppraisalStatus::GoalSetting,
        'goal_submitted_at' => null,
    ]);
    AppraisalObjective::factory()->create([
        'appraisal_id' => $existing->id,
        'title' => 'Old goal that must be replaced',
        'sort_order' => 1,
    ]);

    app(ReviewCycleAutomationService::class)->open($cycle, $actor);

    $prepared = Appraisal::query()->findOrFail($existing->id);

    expect($prepared->template_id)->toBe($selectedTemplate->id)
        ->and($prepared->status)->toBe(AppraisalStatus::SelfAssessmentPending)
        ->and($prepared->objectives()->count())->toBe(4)
        ->and($prepared->objectives()->where('title', 'Old goal that must be replaced')->exists())->toBeFalse()
        ->and($prepared->approvals()->count())->toBe(1)
        ->and($prepared->statusHistories()->count())->toBe(1);
});

test('opening a cycle requires all-location organization access', function () {
    automaticKpiTenantContext();
    $user = User::factory()->create();
    $user->memberships()->update(['access_all_locations' => false]);

    foreach (['performance.review_cycles.update', 'performance.review_cycles.open'] as $permissionName) {
        Permission::findOrCreate($permissionName, 'web');
        $user->givePermissionTo($permissionName);
    }

    $cycle = automaticKpiCycle(automaticKpiTemplate());

    $this->actingAs($user)
        ->post(route('performance.review_cycles.open', $cycle))
        ->assertForbidden();

    expect($cycle->refresh()->status)->toBe(ReviewCycleStatus::Draft);
});
