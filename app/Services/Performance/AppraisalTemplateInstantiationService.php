<?php

namespace App\Services\Performance;

use App\Models\Appraisal;
use App\Models\AppraisalCompetencyRating;

class AppraisalTemplateInstantiationService
{
    public function createChildren(Appraisal $appraisal): void
    {
        $appraisal->loadMissing('template.items');

        if ($appraisal->competencyRatings()->exists()) {
            return;
        }

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
        }
    }
}
