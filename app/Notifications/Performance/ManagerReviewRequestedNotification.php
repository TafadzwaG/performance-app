<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class ManagerReviewRequestedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Manager review requested',
            "The appraisal for {$appraisal->employee_name_snapshot} needs your review.",
        );
    }
}
