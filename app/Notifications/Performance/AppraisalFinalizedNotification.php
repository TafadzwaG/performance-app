<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class AppraisalFinalizedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Appraisal finalized',
            "The final appraisal for {$appraisal->employee_name_snapshot} is available.",
        );
    }
}
