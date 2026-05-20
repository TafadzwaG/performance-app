<?php

namespace Database\Seeders;

use App\Enums\CompetencyCategory;
use App\Enums\RatingScaleType;
use App\Enums\TemplateItemType;
use App\Models\AppraisalTemplate;
use App\Models\Competency;
use App\Models\Perspective;
use App\Models\RatingScale;
use Illuminate\Database\Seeder;

class PerformanceSetupSeeder extends Seeder
{
    public function run(): void
    {
        $perspectives = collect([
            [
                'name' => 'Financial',
                'code' => 'financial',
                'description' => 'To succeed financially, how should we appear to our shareholders?',
                'sort_order' => 1,
            ],
            [
                'name' => 'Customers',
                'code' => 'customer',
                'description' => 'To achieve our vision, how should we appear to our customers?',
                'sort_order' => 2,
            ],
            [
                'name' => 'Internal Business Process',
                'code' => 'internal_process',
                'description' => 'To satisfy our shareholders and customers, what business processes must we excel at?',
                'sort_order' => 3,
            ],
            [
                'name' => 'Learning & Growth',
                'code' => 'learning_growth',
                'description' => 'To achieve our vision, how will we sustain our ability to change and improve?',
                'sort_order' => 4,
            ],
        ])->map(fn (array $data) => Perspective::query()->updateOrCreate(
            ['code' => $data['code']],
            $data + ['is_active' => true],
        ));

        // Retire the legacy "Behaviours & Values" perspective — its role is now
        // covered by the dedicated Values (competencies) section.
        Perspective::query()->where('code', 'behaviours_values')->update(['is_active' => false]);

        $objectiveScale = RatingScale::query()->updateOrCreate(
            ['code' => 'objective-5-point'],
            [
                'name' => 'Objective 5 Point',
                'applies_to' => RatingScaleType::Objective,
                'description' => 'Standard five point objective performance scale.',
                'is_active' => true,
            ],
        );

        $competencyScale = RatingScale::query()->updateOrCreate(
            ['code' => 'competency-5-point'],
            [
                'name' => 'Competency 5 Point',
                'applies_to' => RatingScaleType::Competency,
                'description' => 'Standard five point competency scale.',
                'is_active' => true,
            ],
        );

        $overallScale = RatingScale::query()->updateOrCreate(
            ['code' => 'overall-performance'],
            [
                'name' => 'Overall Performance',
                'applies_to' => RatingScaleType::Overall,
                'description' => 'Overall performance banding scale.',
                'is_active' => true,
            ],
        );

        // Unified 5-point performance scale — higher value = better performance
        // is preserved so existing score data stays consistent.
        $this->syncScaleLevels($objectiveScale, [
            ['label' => 'Exceptional Performance', 'short_label' => '1', 'value' => 5, 'sort_order' => 1, 'is_default' => false],
            ['label' => 'Very Good Performance',   'short_label' => '2', 'value' => 4, 'sort_order' => 2, 'is_default' => false],
            ['label' => 'Good Performance',        'short_label' => '3', 'value' => 3, 'sort_order' => 3, 'is_default' => true],
            ['label' => 'Improvement Required',    'short_label' => '4', 'value' => 2, 'sort_order' => 4, 'is_default' => false],
            ['label' => 'Unacceptable Performance', 'short_label' => '5', 'value' => 1, 'sort_order' => 5, 'is_default' => false],
        ]);

        $this->syncScaleLevels($competencyScale, [
            ['label' => 'Exceptional Performance', 'short_label' => '1', 'value' => 5, 'sort_order' => 1, 'is_default' => false],
            ['label' => 'Very Good Performance',   'short_label' => '2', 'value' => 4, 'sort_order' => 2, 'is_default' => false],
            ['label' => 'Good Performance',        'short_label' => '3', 'value' => 3, 'sort_order' => 3, 'is_default' => true],
            ['label' => 'Improvement Required',    'short_label' => '4', 'value' => 2, 'sort_order' => 4, 'is_default' => false],
            ['label' => 'Unacceptable Performance', 'short_label' => '5', 'value' => 1, 'sort_order' => 5, 'is_default' => false],
        ]);

        $this->syncScaleLevels($overallScale, [
            ['label' => 'Exceptional Performance',  'short_label' => '1', 'value' => 5, 'min_percent' => 100, 'max_percent' => 200,   'sort_order' => 1, 'is_default' => false],
            ['label' => 'Very Good Performance',    'short_label' => '2', 'value' => 4, 'min_percent' => 90,  'max_percent' => 99.99, 'sort_order' => 2, 'is_default' => false],
            ['label' => 'Good Performance',         'short_label' => '3', 'value' => 3, 'min_percent' => 80,  'max_percent' => 89.99, 'sort_order' => 3, 'is_default' => true],
            ['label' => 'Improvement Required',     'short_label' => '4', 'value' => 2, 'min_percent' => 50,  'max_percent' => 79.99, 'sort_order' => 4, 'is_default' => false],
            ['label' => 'Unacceptable Performance', 'short_label' => '5', 'value' => 1, 'min_percent' => 0,   'max_percent' => 49.99, 'sort_order' => 5, 'is_default' => false],
        ]);

        // Core organisational values — surfaced in the UI as "Values".
        // Stored in the competencies table for schema continuity.
        $competencies = collect([
            [
                'name' => 'We love to win',
                'code' => 'love_to_win',
                'category' => CompetencyCategory::Value,
                'description' => 'Pursues outstanding outcomes with energy, ambition, and accountability for results.',
            ],
            [
                'name' => 'We relate with empathy',
                'code' => 'relate_with_empathy',
                'category' => CompetencyCategory::Value,
                'description' => 'Listens, respects, and supports others — meeting people where they are.',
            ],
            [
                'name' => 'We are agile',
                'code' => 'agile',
                'category' => CompetencyCategory::Value,
                'description' => 'Adapts quickly, learns continuously, and turns change into momentum.',
            ],
            [
                'name' => 'We work better together',
                'code' => 'work_better_together',
                'category' => CompetencyCategory::Value,
                'description' => 'Collaborates across teams and disciplines to deliver shared outcomes.',
            ],
        ])->map(fn (array $data) => Competency::query()->updateOrCreate(
            ['code' => $data['code']],
            $data + ['is_active' => true],
        ));

        // Retire legacy seed competencies — they remain in the database for
        // historical appraisal references but are hidden from the picker.
        Competency::query()
            ->whereIn('code', ['integrity', 'collaboration', 'customer_focus'])
            ->update(['is_active' => false]);

        $template = AppraisalTemplate::query()->updateOrCreate(
            ['code' => 'mvp-default', 'version' => 1],
            [
                'name' => 'MVP Default Template',
                'description' => 'Default performance appraisal template for the MVP module.',
                'objective_rating_scale_id' => $objectiveScale->id,
                'competency_rating_scale_id' => $competencyScale->id,
                'overall_rating_scale_id' => $overallScale->id,
                'business_weight_percent' => 80,
                'values_weight_percent' => 20,
                'min_objectives' => 4,
                'max_objectives' => 6,
                'allow_competencies' => true,
                'is_active' => true,
            ],
        );

        $template->items()->delete();

        foreach ($perspectives->where('code', '!=', 'behaviours_values')->take(4)->values() as $index => $perspective) {
            $template->items()->create([
                'item_type' => TemplateItemType::Objective,
                'perspective_id' => $perspective->id,
                'title' => "{$perspective->name} Objective ".($index + 1),
                'description' => "Default {$perspective->name} objective placeholder.",
                'default_weight' => 25,
                'evidence_source_hint' => 'Documents, dashboards, stakeholder feedback.',
                'sort_order' => $index,
                'is_required' => true,
            ]);
        }

        foreach ($competencies as $offset => $competency) {
            $template->items()->create([
                'item_type' => TemplateItemType::Competency,
                'competency_id' => $competency->id,
                'title' => $competency->name,
                'description' => $competency->description,
                'sort_order' => 100 + $offset,
                'is_required' => true,
            ]);
        }
    }

    private function syncScaleLevels(RatingScale $scale, array $levels): void
    {
        $scale->levels()->delete();

        foreach ($levels as $level) {
            $scale->levels()->create($level);
        }
    }
}
