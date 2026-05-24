<?php

use App\Enums\AppraisalStatus;
use App\Enums\CommentType;
use App\Enums\CompetencyCategory;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\AppraisalComment;
use App\Models\AppraisalCompetencyRating;
use App\Models\AppraisalObjective;
use App\Models\Competency;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\WelcomePlatformStatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

test('welcome page renders live platform stats', function () {
    Cache::forget('welcome.platform_stats');
    Cache::forget('welcome.platform_stats.v2');

    $response = $this->get(route('home'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('platformStats')
            ->has('platformStats.company_values')
            ->where('platformStats.has_data', false));
});

test('welcome platform stats reflect finalized reviews and cycle activity', function () {
    Cache::forget('welcome.platform_stats');
    Cache::forget('welcome.platform_stats.v2');

    $user = User::factory()->create();
    $profile = EmployeeProfile::factory()->for($user)->create();
    $cycle = ReviewCycle::factory()->create([
        'name' => 'FY 2026 Mid-Year',
        'status' => ReviewCycleStatus::Open,
    ]);

    $appraisal = Appraisal::factory()->create([
        'employee_profile_id' => $profile->id,
        'employee_user_id' => $user->id,
        'review_cycle_id' => $cycle->id,
        'status' => AppraisalStatus::Finalized,
        'overall_score' => 82.5,
        'finalized_at' => now()->subMonth(),
    ]);

    $competency = Competency::query()->create([
        'name' => 'Integrity',
        'code' => 'VAL-001',
        'category' => CompetencyCategory::Value,
        'is_active' => true,
    ]);

    AppraisalCompetencyRating::query()->create([
        'appraisal_id' => $appraisal->id,
        'competency_id' => $competency->id,
        'manager_rating_score' => 4,
        'sort_order' => 1,
    ]);

    AppraisalObjective::factory()->create([
        'appraisal_id' => $appraisal->id,
        'manager_rating_score' => 4,
        'performance_achieved' => 'Delivered all KPIs',
    ]);

    AppraisalComment::query()->create([
        'appraisal_id' => $appraisal->id,
        'author_user_id' => $user->id,
        'comment_type' => CommentType::General,
        'body' => 'Strong progress on delivery goals.',
    ]);

    $stats = app(WelcomePlatformStatsService::class)->snapshot();

    expect($stats['has_data'])->toBeTrue()
        ->and($stats['performance_trend']['sample_size'])->toBe(1)
        ->and($stats['competency_mix']['items'][0]['name'])->toBe('Values')
        ->and($stats['goals']['completed'])->toBe(1)
        ->and($stats['goals']['total'])->toBe(1)
        ->and($stats['feedback_velocity']['total_this_month'])->toBeGreaterThanOrEqual(1);
});

test('welcome platform stats include active value competencies as company values', function () {
    Cache::forget('welcome.platform_stats');
    Cache::forget('welcome.platform_stats.v2');

    Competency::query()->create([
        'name' => 'Integrity',
        'code' => 'integrity',
        'category' => CompetencyCategory::Value,
        'description' => 'We act with honesty and transparency.',
        'is_active' => true,
    ]);

    Competency::query()->create([
        'name' => 'Legacy Value',
        'code' => 'legacy_value',
        'category' => CompetencyCategory::Value,
        'description' => 'Inactive value should not appear.',
        'is_active' => false,
    ]);

    Competency::query()->create([
        'name' => 'Problem Solving',
        'code' => 'problem_solving',
        'category' => CompetencyCategory::Competency,
        'description' => 'Not a company value.',
        'is_active' => true,
    ]);

    $stats = app(WelcomePlatformStatsService::class)->snapshot();

    expect($stats['company_values'])->toHaveCount(1)
        ->and($stats['company_values'][0]['name'])->toBe('Integrity')
        ->and($stats['company_values'][0]['description'])->toBe('We act with honesty and transparency.');
});
