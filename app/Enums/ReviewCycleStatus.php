<?php

namespace App\Enums;

enum ReviewCycleStatus: string
{
    case Draft = 'draft';
    case Open = 'open';
    case Closed = 'closed';
}
