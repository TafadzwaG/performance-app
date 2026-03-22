<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class AppraisalApprovedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Appraisal approved',
            "The appraisal for {$appraisal->employee_name_snapshot} has been approved and is ready for finalization.",
        );
    }
}
