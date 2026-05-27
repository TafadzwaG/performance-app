<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class AppraisalFinalizationRequestedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Finalization requested',
            "The appraisal for {$appraisal->employee_name_snapshot} has completed calibration and is ready for finalization.",
        );
    }
}
