<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class AppraisalAssignedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Appraisal assigned',
            "A new appraisal for {$appraisal->cycle_name_snapshot} is ready for goal planning.",
        );
    }
}
