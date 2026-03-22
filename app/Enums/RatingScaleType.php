<?php

namespace App\Enums;

enum RatingScaleType: string
{
    case Objective = 'objective';
    case Competency = 'competency';
    case Overall = 'overall';
}
