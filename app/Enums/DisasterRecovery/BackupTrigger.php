<?php

namespace App\Enums\DisasterRecovery;

enum BackupTrigger: string
{
    case Manual = 'manual';
    case Automatic = 'automatic';
    case PreRestore = 'pre_restore';
}
