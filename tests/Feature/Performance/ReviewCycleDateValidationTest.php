<?php

use App\Enums\ReviewCycleStatus;
use App\Models\AppraisalTemplate;
use App\Models\Permission;
use App\Models\ReviewCycle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function reviewCyclePayload(array $overrides = []): array
{
    return array_merge([
        'name' => '2026 Annual Review',
        'code' => 'ARC-2026',
        'description' => 'Annual performance review.',
        'start_date' => '2026-06-01',
        'end_date' => '2026-12-31',
        'goal_setting_deadline' => '2026-06-15',
        'self_assessment_deadline' => '2026-09-30',
        'manager_review_deadline' => '2026-10-31',
        'approval_deadline' => '2026-11-30',
        'template_id' => AppraisalTemplate::factory()->create()->id,
        'status' => ReviewCycleStatus::Draft->value,
    ], $overrides);
}

function reviewCycleAdmin(string $permission): User
{
    $user = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate($permission, 'web');
    $user->givePermissionTo($permission);

    return $user;
}

test('review cycle creation rejects a start date that has passed', function () {
    $this->travelTo('2026-05-20 08:00:00');
    $user = reviewCycleAdmin('performance.review_cycles.create');

    $this->actingAs($user)
        ->from(route('performance.review_cycles.create'))
        ->post(route('performance.review_cycles.store'), reviewCyclePayload([
            'start_date' => '2026-05-19',
            'end_date' => '2026-12-31',
        ]))
        ->assertRedirect(route('performance.review_cycles.create'))
        ->assertSessionHasErrors('start_date');
});

test('review cycle creation rejects milestone dates outside the cycle window', function () {
    $this->travelTo('2026-05-20 08:00:00');
    $user = reviewCycleAdmin('performance.review_cycles.create');

    $this->actingAs($user)
        ->post(route('performance.review_cycles.store'), reviewCyclePayload([
            'goal_setting_deadline' => '2026-05-31',
            'approval_deadline' => '2027-01-01',
        ]))
        ->assertSessionHasErrors(['goal_setting_deadline', 'approval_deadline']);
});

test('review cycle creation rejects milestones that are out of sequence', function () {
    $this->travelTo('2026-05-20 08:00:00');
    $user = reviewCycleAdmin('performance.review_cycles.create');

    $this->actingAs($user)
        ->post(route('performance.review_cycles.store'), reviewCyclePayload([
            'self_assessment_deadline' => '2026-06-10',
            'goal_setting_deadline' => '2026-06-15',
        ]))
        ->assertSessionHasErrors('self_assessment_deadline');
});

test('review cycle updates validate milestone dates against the cycle window and order', function () {
    $this->travelTo('2026-05-20 08:00:00');
    $user = reviewCycleAdmin('performance.review_cycles.update');
    $cycle = ReviewCycle::factory()->create([
        'start_date' => '2026-06-01',
        'end_date' => '2026-12-31',
    ]);

    $this->actingAs($user)
        ->put(route('performance.review_cycles.update', $cycle), reviewCyclePayload([
            'code' => $cycle->code,
            'goal_setting_deadline' => '2026-06-20',
            'self_assessment_deadline' => '2026-06-10',
            'manager_review_deadline' => '2027-01-01',
        ]))
        ->assertSessionHasErrors(['self_assessment_deadline', 'manager_review_deadline']);
});
