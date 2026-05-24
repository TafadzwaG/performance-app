<?php

use App\Enums\DisasterRecovery\BackupStatus;
use App\Models\DisasterRecoveryBackup;
use App\Models\DisasterRecoveryRestoreRequest;
use App\Services\DisasterRecovery\BackupArchiveService;
use App\Services\DisasterRecovery\DisasterRecoveryService;
use App\Services\DisasterRecovery\RestoreExecutionService;
use App\Services\DisasterRecovery\RestoreTestService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('dr:backup {--manual : Record the run as a manual backup}', function (BackupArchiveService $archives, DisasterRecoveryService $disasterRecovery) {
    $backup = $this->option('manual')
        ? $archives->createQueuedBackup(\App\Enums\DisasterRecovery\BackupTrigger::Manual)
        : $disasterRecovery->createAutomaticBackup();

    $archives->run($backup);

    $this->info("Disaster recovery backup completed: {$backup->fresh()->path}");
})->purpose('Create a disaster recovery database and file backup');

Artisan::command('dr:restore-test', function (RestoreTestService $restoreTests) {
    $result = $restoreTests->runLatest();

    $this->info("Disaster recovery restore test finished with status: {$result->status->value}");
})->purpose('Verify the latest disaster recovery backup in an isolated temporary target');

Artisan::command('dr:restore {backupId} {--approved-request= : Approved restore request id}', function (int $backupId, RestoreExecutionService $restoreExecution) {
    $backup = DisasterRecoveryBackup::query()
        ->where('status', BackupStatus::Completed)
        ->findOrFail($backupId);

    $restoreRequestId = $this->option('approved-request');
    $restoreRequest = DisasterRecoveryRestoreRequest::query()
        ->whereKey($restoreRequestId)
        ->where('disaster_recovery_backup_id', $backup->id)
        ->firstOrFail();

    $restoreExecution->run($restoreRequest);

    $this->info("Disaster recovery restore completed for backup {$backup->id}.");
})->purpose('Run an approved disaster recovery restore');

Schedule::command('dr:backup')->dailyAt('02:00');
Schedule::command('dr:restore-test')->monthlyOn(1, '03:00');
