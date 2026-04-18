<?php

namespace App\Enums;

enum CalibrationDecision: string
{
    case Confirmed = 'confirmed';
    case Adjusted = 'adjusted';
    case Returned = 'returned';
}
