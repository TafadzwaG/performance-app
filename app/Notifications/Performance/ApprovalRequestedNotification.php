<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class ApprovalRequestedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Approval requested',
            "The appraisal for {$appraisal->employee_name_snapshot} is awaiting your approval.",
        );
    }
}
