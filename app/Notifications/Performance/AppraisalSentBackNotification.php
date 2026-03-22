<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class AppraisalSentBackNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Appraisal sent back',
            "The appraisal for {$appraisal->employee_name_snapshot} was sent back for changes.",
        );
    }
}
