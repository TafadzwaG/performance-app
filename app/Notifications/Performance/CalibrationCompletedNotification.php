<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class CalibrationCompletedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Calibration completed',
            "Calibration has been completed for {$appraisal->employee_name_snapshot} and the appraisal is ready for finalization.",
        );
    }
}
