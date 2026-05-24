<?php

namespace App\Jobs\DisasterRecovery;

use App\Models\DisasterRecoveryBackup;
use App\Services\DisasterRecovery\BackupArchiveService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RunDisasterRecoveryBackupJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public DisasterRecoveryBackup $backup) {}

    public function handle(BackupArchiveService $archives): void
    {
        $archives->run($this->backup);
    }
}
