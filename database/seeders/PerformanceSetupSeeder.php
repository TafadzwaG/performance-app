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
                'name' => 'Customer',
                'code' => 'customer',
                'description' => 'To achieve our vision, how should we appear to our customers?',
                'sort_order' => 2,
            ],
            [
                'name' => 'Internal Process',
                'code' => 'internal_process',
                'description' => 'To satisfy our shareholders and customers, what business processes must we excel at?',
                'sort_order' => 3,
            ],
            [
                'name' => 'Learning/Growth',
                'code' => 'learning_growth',
                'description' => 'To achieve our vision, how will we sustain our ability to change and improve?',
                'sort_order' => 4,
            ],
            [
                'name' => 'Values/Behaviors',
                'code' => 'values_behaviors',
                'description' => 'Values and behaviours assessed through the dedicated values section.',
                'sort_order' => 5,
            ],
        ])->map(fn (array $data) => Perspective::query()->updateOrCreate(
            ['code' => $data['code']],
            $data + ['is_active' => true],
        ));

        Perspective::query()->where('code', 'behaviours_values')->update(['is_active' => false]);

        $objectiveScale = RatingScale::query()->updateOrCreate(
            ['code' => 'objective-5-point'],
            [
                'name' => 'Business Objectives',
                'applies_to' => RatingScaleType::Objective,
                'description' => 'Business objectives rating scale from the Monomotapa assessment form.',
                'is_active' => true,
            ],
        );

        RatingScale::query()
            ->where('code', 'competency-5-point')
            ->update(['is_active' => false]);

        $valuesScale = RatingScale::query()->updateOrCreate(
            ['code' => 'competency-values'],
            [
                'name' => 'Values Objectives',
                'applies_to' => RatingScaleType::Competency,
                'description' => 'Values objectives rating scale from the Monomotapa assessment form.',
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

        RatingScale::withTrashed()
            ->whereNotIn('code', ['objective-5-point', 'competency-values', 'overall-performance'])
            ->update(['is_active' => false]);

        RatingScale::query()
            ->whereNotIn('code', ['objective-5-point', 'competency-values', 'overall-performance'])
            ->delete();

        $this->syncScaleLevels($objectiveScale, [
            ['label' => 'Exceptional performance', 'description' => 'This person has far exceeded their agreed objectives and agreed performance standards.', 'short_label' => '1', 'value' => 5, 'min_percent' => 100, 'max_percent' => null, 'sort_order' => 1, 'is_default' => false],
            ['label' => 'Very good performance', 'description' => 'This person has consistently met their objectives to the agreed performance standards. In some cases they have achieved more than their agreed objectives and to a higher standard than expected.', 'short_label' => '2', 'value' => 4, 'min_percent' => 90, 'max_percent' => 99, 'sort_order' => 2, 'is_default' => false],
            ['label' => 'Good performance', 'description' => 'This person has achieved the agreed objectives to the agreed performance standards. This is the minimum performance expected from every employee in Integrated Properties.', 'short_label' => '3', 'value' => 3, 'min_percent' => 80, 'max_percent' => 90, 'sort_order' => 3, 'is_default' => true],
            ['label' => 'Improvement required', 'description' => 'This person has met some or most of their objectives to the expected performance standards. In a few areas they did not meet their objectives and/or agreed standards.', 'short_label' => '4', 'value' => 2, 'min_percent' => 50, 'max_percent' => 79, 'sort_order' => 4, 'is_default' => false],
            ['label' => 'Unacceptable performance', 'description' => 'This person has not met most or all of their objectives and expected performance standards. Their performance has been consistently poor which has proved detrimental to the team / business unit.', 'short_label' => '5', 'value' => 1, 'min_percent' => 1, 'max_percent' => 49, 'sort_order' => 5, 'is_default' => false],
        ]);

        $this->syncScaleLevels($valuesScale, [
            ['label' => 'Role models the values', 'description' => "This person is a role model for the way the Company's employees should behave. In all situations and in all ways they embody the Company's values and coach/influence others to more fully embody the values.", 'short_label' => 'A', 'value' => 4, 'sort_order' => 1, 'is_default' => false],
            ['label' => 'Lives the values in most situations', 'description' => "This person fully understands what the Company's values mean for how they should behave and in most circumstances demonstrates behaviour that supports the values. This is expected of all employees.", 'short_label' => 'B', 'value' => 3, 'sort_order' => 2, 'is_default' => true],
            ['label' => 'Lives the values in many situations', 'description' => "This person generally understands what the Company's values mean for how they should behave and in many situations demonstrates the values. In some ways however they need to more fully live the values.", 'short_label' => 'C', 'value' => 2, 'sort_order' => 3, 'is_default' => false],
            ['label' => 'Fails to live the values in some significant ways', 'description' => "This person in some persistent way does not demonstrate the Company's values; either their behaviour does not support the values, or they do not accept that how they behave is important. Radical improvement is required in how they live the values everyday.", 'short_label' => 'D', 'value' => 1, 'sort_order' => 4, 'is_default' => false],
        ]);

        $this->syncScaleLevels($overallScale, [
            ['label' => 'Exceptional performance', 'description' => 'This person has far exceeded their agreed objectives and agreed performance standards.', 'short_label' => '1', 'value' => 5, 'min_percent' => 100, 'max_percent' => null, 'sort_order' => 1, 'is_default' => false],
            ['label' => 'Very good performance', 'description' => 'This person has consistently met their objectives to the agreed performance standards. In some cases they have achieved more than their agreed objectives and to a higher standard than expected.', 'short_label' => '2', 'value' => 4, 'min_percent' => 90, 'max_percent' => 99, 'sort_order' => 2, 'is_default' => false],
            ['label' => 'Good performance', 'description' => 'This person has achieved the agreed objectives to the agreed performance standards. This is the minimum performance expected from every employee in Integrated Properties.', 'short_label' => '3', 'value' => 3, 'min_percent' => 80, 'max_percent' => 90, 'sort_order' => 3, 'is_default' => true],
            ['label' => 'Improvement required', 'description' => 'This person has met some or most of their objectives to the expected performance standards. In a few areas they did not meet their objectives and/or agreed standards.', 'short_label' => '4', 'value' => 2, 'min_percent' => 50, 'max_percent' => 79, 'sort_order' => 4, 'is_default' => false],
            ['label' => 'Unacceptable performance', 'description' => 'This person has not met most or all of their objectives and expected performance standards. Their performance has been consistently poor which has proved detrimental to the team / business unit.', 'short_label' => '5', 'value' => 1, 'min_percent' => 1, 'max_percent' => 49, 'sort_order' => 5, 'is_default' => false],
        ]);

        $competencies = collect([
            [
                'name' => 'We love to win',
                'code' => 'we_love_to_win',
                'category' => CompetencyCategory::Value,
                'description' => 'Demonstrates drive for results and a shared commitment to success.',
            ],
            [
                'name' => 'We relate with empathy',
                'code' => 'we_relate_with_empathy',
                'category' => CompetencyCategory::Value,
                'description' => 'Shows understanding, respect, and care in every interaction.',
            ],
            [
                'name' => 'We are agile',
                'code' => 'we_are_agile',
                'category' => CompetencyCategory::Value,
                'description' => 'Adapts quickly, embraces change, and responds effectively to new challenges.',
            ],
            [
                'name' => 'We work better together',
                'code' => 'we_work_better_together',
                'category' => CompetencyCategory::Value,
                'description' => 'Collaborates openly and builds trust across teams to achieve shared goals.',
            ],
        ])->map(fn (array $data) => Competency::withTrashed()->updateOrCreate(
            ['code' => $data['code']],
            $data + ['is_active' => true, 'deleted_at' => null],
        ));

        collect([
            ['name' => 'Guest Obsession', 'code' => 'guest_obsession', 'description' => 'Anticipates guest needs, responds with care, and uses feedback to improve service.'],
            ['name' => 'Ownership', 'code' => 'ownership', 'description' => 'Accepts accountability, follows through on commitments, and resolves issues promptly.'],
            ['name' => 'Integrity', 'code' => 'integrity', 'description' => 'Demonstrates honesty, confidentiality, and ethical judgement.'],
            ['name' => 'Collaboration', 'code' => 'collaboration', 'description' => 'Works constructively with peers and stakeholders.'],
            ['name' => 'Customer Focus', 'code' => 'customer_focus', 'description' => 'Keeps customer needs central to service delivery.'],
        ])->each(fn (array $legacyCompetency) => Competency::withTrashed()->updateOrCreate(
            ['code' => $legacyCompetency['code']],
            $legacyCompetency + [
                'category' => CompetencyCategory::Value,
                'is_active' => false,
            ],
        ));

        AppraisalTemplate::withTrashed()
            ->where('code', 'mvp-default')
            ->update([
                'is_default' => false,
                'is_protected' => false,
                'is_active' => false,
            ]);

        $template = AppraisalTemplate::withTrashed()->updateOrCreate(
            ['code' => 'monomotapa-performance-appraisal', 'version' => 1],
            [
                'name' => 'Monomotapa Performance Appraisal Template',
                'description' => 'Default individual performance assessment form template for Monomotapa.',
                'objective_rating_scale_id' => $objectiveScale->id,
                'competency_rating_scale_id' => $valuesScale->id,
                'overall_rating_scale_id' => $overallScale->id,
                'business_weight_percent' => 80,
                'values_weight_percent' => 20,
                'min_objectives' => 4,
                'max_objectives' => 6,
                'allow_competencies' => true,
                'is_default' => true,
                'is_protected' => true,
                'is_active' => true,
                'deleted_at' => null,
            ],
        );

        AppraisalTemplate::withTrashed()
            ->whereKeyNot($template->id)
            ->update([
                'is_default' => false,
                'is_protected' => false,
                'is_active' => false,
            ]);

        AppraisalTemplate::query()
            ->whereKeyNot($template->id)
            ->delete();

        $template->items()->delete();

        foreach ($this->objectiveItems($perspectives) as $index => $item) {
            $template->items()->create([
                'item_type' => TemplateItemType::Objective,
                'perspective_id' => $item['perspective_id'],
                'title' => $item['title'],
                'description' => $item['description'],
                'default_weight' => $item['weight'],
                'evidence_source_hint' => $item['evidence'],
                'sort_order' => $index + 1,
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

    private function objectiveItems($perspectives): array
    {
        $byCode = $perspectives->keyBy('code');

        return [
            [
                'perspective_id' => $byCode['financial']->id,
                'title' => 'Maximize room revenue',
                'description' => 'Achieve ADR of 150.',
                'weight' => 20,
                'evidence' => 'PMS report',
            ],
            [
                'perspective_id' => $byCode['customer']->id,
                'title' => 'Deliver exceptional arrival experience',
                'description' => 'Maintain guest satisfaction score of 95% positive.',
                'weight' => 25,
                'evidence' => 'Feedback system',
            ],
            [
                'perspective_id' => $byCode['internal_process']->id,
                'title' => 'Ensure efficient operations',
                'description' => 'Check in guests within 3 minutes for 95% of arrivals.',
                'weight' => 20,
                'evidence' => 'PMS data',
            ],
            [
                'perspective_id' => $byCode['internal_process']->id,
                'title' => 'Upsell room categories',
                'description' => 'Achieve upsells on 15% of check-ins.',
                'weight' => 15,
                'evidence' => 'Front office logs',
            ],
            [
                'perspective_id' => $byCode['learning_growth']->id,
                'title' => 'Develop team capability',
                'description' => 'Ensure 100% of team members are trained on the new PMS.',
                'weight' => 20,
                'evidence' => 'Training records',
            ],
        ];
    }

    private function syncScaleLevels(RatingScale $scale, array $levels): void
    {
        $scale->levels()->delete();

        foreach ($levels as $level) {
            $scale->levels()->create($level);
        }
    }
}
