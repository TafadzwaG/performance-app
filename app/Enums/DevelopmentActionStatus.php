<?php

namespace App\Enums;

enum DevelopmentActionStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Completed = 'completed';
}
