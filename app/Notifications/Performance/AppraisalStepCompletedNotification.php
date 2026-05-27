<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;

class AppraisalStepCompletedNotification extends AbstractAppraisalNotification
{
    public static function make(Appraisal $appraisal, string $stepLabel, string $message): self
    {
        return new self($appraisal, "{$stepLabel} completed", $message);
    }
}
