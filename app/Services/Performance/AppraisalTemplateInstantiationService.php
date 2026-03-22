<?php

namespace App\Services\Performance;

use App\Models\Appraisal;
use App\Models\AppraisalCompetencyRating;
use App\Models\AppraisalObjective;
use App\Models\Perspective;

class AppraisalTemplateInstantiationService
{
    public function createChildren(Appraisal $appraisal): void
    {
        $appraisal->loadMissing('template.items');

        if ($appraisal->objectives()->exists() || $appraisal->competencyRatings()->exists()) {
            return;
        }

        $objectiveSort = 1;
        $competencySort = 1;

        foreach ($appraisal->template->items as $item) {
            if ($item->item_type?->value === 'competency') {
                AppraisalCompetencyRating::create([
                    'appraisal_id' => $appraisal->id,
                    'competency_id' => $item->competency_id,
                    'sort_order' => $competencySort++,
                ]);

                continue;
            }

            AppraisalObjective::create([
                'appraisal_id' => $appraisal->id,
                'template_item_id' => $item->id,
                'perspective_id' => $item->perspective_id ?? Perspective::query()->value('id'),
                'objective_type' => 'business',
                'title' => $item->title,
                'target_definition' => $item->description,
                'weight' => $item->default_weight ?? 0,
                'evidence_source' => $item->evidence_source_hint,
                'sort_order' => $objectiveSort++,
                'include_in_business_score' => true,
            ]);
        }

        if (!$appraisal->objectives()->exists()) {
            $defaultPerspectiveId = Perspective::query()->value('id');

            foreach (range(1, max(1, (int) $appraisal->template->min_objectives)) as $index) {
                AppraisalObjective::create([
                    'appraisal_id' => $appraisal->id,
                    'perspective_id' => $defaultPerspectiveId,
                    'objective_type' => 'business',
                    'title' => "Objective {$index}",
                    'sort_order' => $objectiveSort++,
                    'include_in_business_score' => true,
                ]);
            }
        }
    }
}
