<?php

namespace App\Enums\DisasterRecovery;

enum BackupStatus: string
{
    case Queued = 'queued';
    case Running = 'running';
    case Completed = 'completed';
    case Failed = 'failed';
}
