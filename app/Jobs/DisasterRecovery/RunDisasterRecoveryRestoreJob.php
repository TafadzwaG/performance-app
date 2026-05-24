<?php

namespace App\Jobs\DisasterRecovery;

use App\Models\DisasterRecoveryRestoreRequest;
use App\Services\DisasterRecovery\RestoreExecutionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RunDisasterRecoveryRestoreJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public DisasterRecoveryRestoreRequest $restoreRequest) {}

    public function handle(RestoreExecutionService $restore): void
    {
        $restore->run($this->restoreRequest);
    }
}
