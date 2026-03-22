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
            ['name' => 'Financial', 'code' => 'financial', 'description' => 'Measures financial contribution.', 'sort_order' => 1],
            ['name' => 'Customer', 'code' => 'customer', 'description' => 'Measures customer impact and service.', 'sort_order' => 2],
            ['name' => 'Internal Process', 'code' => 'internal_process', 'description' => 'Measures operational effectiveness.', 'sort_order' => 3],
            ['name' => 'Learning & Growth', 'code' => 'learning_growth', 'description' => 'Measures development and capability growth.', 'sort_order' => 4],
            ['name' => 'Behaviours & Values', 'code' => 'behaviours_values', 'description' => 'Measures alignment to organisational values.', 'sort_order' => 5],
        ])->map(fn (array $data) => Perspective::query()->updateOrCreate(
            ['code' => $data['code']],
            $data + ['is_active' => true],
        ));

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

        $this->syncScaleLevels($objectiveScale, [
            ['label' => 'Outstanding', 'short_label' => '5', 'value' => 5, 'sort_order' => 1, 'is_default' => false],
            ['label' => 'Exceeds Expectations', 'short_label' => '4', 'value' => 4, 'sort_order' => 2, 'is_default' => false],
            ['label' => 'Meets Expectations', 'short_label' => '3', 'value' => 3, 'sort_order' => 3, 'is_default' => true],
            ['label' => 'Partially Meets', 'short_label' => '2', 'value' => 2, 'sort_order' => 4, 'is_default' => false],
            ['label' => 'Below Expectations', 'short_label' => '1', 'value' => 1, 'sort_order' => 5, 'is_default' => false],
        ]);

        $this->syncScaleLevels($competencyScale, [
            ['label' => 'Role Model', 'short_label' => '5', 'value' => 5, 'sort_order' => 1, 'is_default' => false],
            ['label' => 'Strong', 'short_label' => '4', 'value' => 4, 'sort_order' => 2, 'is_default' => false],
            ['label' => 'Solid', 'short_label' => '3', 'value' => 3, 'sort_order' => 3, 'is_default' => true],
            ['label' => 'Developing', 'short_label' => '2', 'value' => 2, 'sort_order' => 4, 'is_default' => false],
            ['label' => 'Needs Attention', 'short_label' => '1', 'value' => 1, 'sort_order' => 5, 'is_default' => false],
        ]);

        $this->syncScaleLevels($overallScale, [
            ['label' => 'Exceptional', 'short_label' => 'A', 'value' => 5, 'min_percent' => 90, 'max_percent' => 100, 'sort_order' => 1, 'is_default' => false],
            ['label' => 'Strong Performer', 'short_label' => 'B', 'value' => 4, 'min_percent' => 75, 'max_percent' => 89.99, 'sort_order' => 2, 'is_default' => false],
            ['label' => 'Effective', 'short_label' => 'C', 'value' => 3, 'min_percent' => 60, 'max_percent' => 74.99, 'sort_order' => 3, 'is_default' => true],
            ['label' => 'Needs Improvement', 'short_label' => 'D', 'value' => 2, 'min_percent' => 45, 'max_percent' => 59.99, 'sort_order' => 4, 'is_default' => false],
            ['label' => 'Unsatisfactory', 'short_label' => 'E', 'value' => 1, 'min_percent' => 0, 'max_percent' => 44.99, 'sort_order' => 5, 'is_default' => false],
        ]);

        $competencies = collect([
            ['name' => 'Integrity', 'code' => 'integrity', 'category' => CompetencyCategory::Value, 'description' => 'Acts with honesty and accountability.'],
            ['name' => 'Collaboration', 'code' => 'collaboration', 'category' => CompetencyCategory::Behaviour, 'description' => 'Works constructively across teams.'],
            ['name' => 'Customer Focus', 'code' => 'customer_focus', 'category' => CompetencyCategory::Competency, 'description' => 'Delivers measurable customer outcomes.'],
        ])->map(fn (array $data) => Competency::query()->updateOrCreate(
            ['code' => $data['code']],
            $data + ['is_active' => true],
        ));

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
