<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class CalibrationRequestedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Calibration requested',
            "The appraisal for {$appraisal->employee_name_snapshot} is ready for calibration review.",
        );
    }
}
