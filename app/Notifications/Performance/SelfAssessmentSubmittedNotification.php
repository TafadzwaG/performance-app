<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class SelfAssessmentSubmittedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Self assessment submitted',
            "{$appraisal->employee_name_snapshot} submitted a self assessment and the appraisal is ready for manager review.",
        );
    }
}
