<?php

namespace App\Enums;

enum EmploymentStatus: string
{
    case Active = 'active';
    case Probation = 'probation';
    case Contract = 'contract';
    case Exited = 'exited';
}
