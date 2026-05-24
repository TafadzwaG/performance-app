<?php

use App\Enums\TemplateItemType;
use App\Models\AppraisalTemplate;
use App\Models\Permission;
use App\Models\RatingScale;
use App\Models\User;
use Database\Seeders\PerformanceSetupSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('performance setup seeder creates one protected monomotapa default template', function () {
    AppraisalTemplate::factory()->create([
        'name' => 'Legacy Template',
        'code' => 'legacy-template',
    ]);

    $this->seed(PerformanceSetupSeeder::class);

    $defaultTemplate = AppraisalTemplate::query()
        ->where('name', 'Monomotapa Performance Appraisal Template')
        ->first();

    expect($defaultTemplate)->not->toBeNull()
        ->and($defaultTemplate->code)->toBe('monomotapa-performance-appraisal')
        ->and($defaultTemplate->is_default)->toBeTrue()
        ->and($defaultTemplate->is_protected)->toBeTrue()
        ->and($defaultTemplate->is_active)->toBeTrue()
        ->and($defaultTemplate->business_weight_percent)->toBe(80)
        ->and($defaultTemplate->values_weight_percent)->toBe(20)
        ->and($defaultTemplate->items()->count())->toBeGreaterThanOrEqual(9)
        ->and(
            $defaultTemplate->items()
                ->where('item_type', TemplateItemType::Competency)
                ->with('competency')
                ->get()
                ->pluck('competency.name')
                ->all()
        )->toBe([
            'We love to win',
            'We relate with empathy',
            'We are agile',
            'We work better together',
        ]);

    expect(AppraisalTemplate::query()->whereNull('deleted_at')->count())->toBe(1);

    $legacyTemplate = AppraisalTemplate::withTrashed()
        ->where('code', 'legacy-template')
        ->first();

    expect($legacyTemplate?->trashed())->toBeTrue();
});

test('protected default template cannot be deleted', function () {
    $this->seed(PerformanceSetupSeeder::class);

    $admin = User::factory()->create(['is_approved' => true]);
    Permission::findOrCreate('performance.templates.view', 'web');
    Permission::findOrCreate('performance.templates.archive', 'web');
    $admin->givePermissionTo(['performance.templates.view', 'performance.templates.archive']);

    $template = AppraisalTemplate::query()
        ->where('name', 'Monomotapa Performance Appraisal Template')
        ->firstOrFail();

    $this->actingAs($admin)
        ->delete(route('performance.templates.destroy', $template))
        ->assertForbidden();

    expect($template->fresh()->trashed())->toBeFalse();
});

test('monomotapa seeder aligns rating scale labels with uploaded form', function () {
    $this->seed(PerformanceSetupSeeder::class);

    $objectiveLevels = RatingScale::query()
        ->where('code', 'objective-5-point')
        ->firstOrFail()
        ->levels()
        ->orderBy('sort_order')
        ->get();

    $valuesLevels = RatingScale::query()
        ->where('code', 'competency-values')
        ->firstOrFail()
        ->levels()
        ->orderBy('sort_order')
        ->get();

    expect($objectiveLevels->pluck('label')->all())->toBe([
        'Exceptional performance',
        'Very good performance',
        'Good performance',
        'Improvement required',
        'Unacceptable performance',
    ])->and($objectiveLevels->first()->description)->toBe('This person has far exceeded their agreed objectives and agreed performance standards.')
        ->and($objectiveLevels->first()->min_percent)->toBe('100.00')
        ->and($objectiveLevels->first()->max_percent)->toBeNull()
        ->and($valuesLevels->pluck('label')->all())->toBe([
            'Role models the values',
            'Lives the values in most situations',
            'Lives the values in many situations',
            'Fails to live the values in some significant ways',
        ])->and($valuesLevels->first()->description)->toContain('role model for the way the Company');
});
