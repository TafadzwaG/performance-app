<?php

namespace App\Enums\DisasterRecovery;

enum RestoreTestStatus: string
{
    case Running = 'running';
    case Passed = 'passed';
    case Failed = 'failed';
}
