<?php

namespace App\Services\DisasterRecovery;

use App\Enums\DisasterRecovery\BackupTrigger;
use App\Enums\DisasterRecovery\RestoreRequestStatus;
use App\Models\DisasterRecoveryRestoreRequest;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;
use Throwable;
use ZipArchive;

class RestoreExecutionService
{
    public function __construct(private BackupArchiveService $archives) {}

    public function run(DisasterRecoveryRestoreRequest $restore): void
    {
        $restore->update([
            'status' => RestoreRequestStatus::Running,
            'started_at' => now(),
            'error_message' => null,
        ]);

        try {
            $preRestore = $this->archives->createQueuedBackup(BackupTrigger::PreRestore, $restore->approved_by_user_id);
            $restore->update(['pre_restore_backup_id' => $preRestore->id]);
            $this->archives->run($preRestore);

            $localArchive = $this->archives->downloadToLocalPath($restore->backup);
            $extractPath = $this->extractArchive($localArchive);

            Artisan::call('down', ['--render' => 'errors::503']);
            $this->restoreArchive($extractPath);
            Artisan::call('up');

            $restore->update([
                'status' => RestoreRequestStatus::Completed,
                'completed_at' => now(),
            ]);
        } catch (Throwable $exception) {
            if (! (bool) config('disaster_recovery.keep_app_down_on_restore_failure', false)) {
                Artisan::call('up');
            }

            $restore->update([
                'status' => RestoreRequestStatus::Failed,
                'error_message' => $exception->getMessage(),
                'completed_at' => now(),
            ]);

            throw $exception;
        }
    }

    private function extractArchive(string $localArchive): string
    {
        $target = (string) config('disaster_recovery.work_path').DIRECTORY_SEPARATOR.'restore-'.now()->format('YmdHis').'-'.bin2hex(random_bytes(4));
        File::ensureDirectoryExists($target);

        $zip = new ZipArchive();
        if ($zip->open($localArchive) !== true) {
            throw new \RuntimeException('Unable to open backup archive.');
        }

        $zip->extractTo($target);
        $zip->close();

        return $target;
    }

    private function restoreArchive(string $extractPath): void
    {
        $manifestPath = $extractPath.DIRECTORY_SEPARATOR.'manifest.json';

        if (! is_file($manifestPath)) {
            throw new \RuntimeException('Backup manifest is missing.');
        }

        $manifest = json_decode((string) File::get($manifestPath), true) ?: [];
        $this->restoreDatabase($extractPath, $manifest);
        $this->restoreFiles($extractPath, $manifest);
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function restoreDatabase(string $extractPath, array $manifest): void
    {
        $database = (array) ($manifest['database'] ?? []);
        $archivePath = str_replace('/', DIRECTORY_SEPARATOR, (string) ($database['archive_path'] ?? ''));
        $source = $extractPath.DIRECTORY_SEPARATOR.$archivePath;

        if (! is_file($source)) {
            throw new \RuntimeException('Database backup file is missing from the archive.');
        }

        $connection = (string) config('database.default');
        $config = (array) config("database.connections.{$connection}", []);
        $driver = (string) ($config['driver'] ?? $connection);

        if ($driver === 'sqlite') {
            $target = (string) ($config['database'] ?? '');
            if ($target === '') {
                throw new \RuntimeException('SQLite database path is not configured.');
            }

            File::ensureDirectoryExists(dirname($target));
            File::copy($source, $target);
            return;
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $command = [
                'mysql',
                '--host='.(string) ($config['host'] ?? '127.0.0.1'),
                '--port='.(string) ($config['port'] ?? '3306'),
                '--user='.(string) ($config['username'] ?? ''),
                (string) ($config['database'] ?? ''),
            ];

            if (filled($config['password'] ?? null)) {
                array_splice($command, 4, 0, ['--password='.(string) $config['password']]);
            }

            $this->runRestoreProcess($command, $source);
            return;
        }

        if ($driver === 'pgsql') {
            $command = [
                'psql',
                '--host='.(string) ($config['host'] ?? '127.0.0.1'),
                '--port='.(string) ($config['port'] ?? '5432'),
                '--username='.(string) ($config['username'] ?? ''),
                '--dbname='.(string) ($config['database'] ?? ''),
                '--file='.$source,
            ];

            $environment = filled($config['password'] ?? null) ? ['PGPASSWORD' => (string) $config['password']] : [];
            $process = new Process($command, base_path(), $environment, null, 300);
            $process->run();

            if (! $process->isSuccessful()) {
                throw new \RuntimeException(trim($process->getErrorOutput()) ?: 'PostgreSQL restore command failed.');
            }
        }
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function restoreFiles(string $extractPath, array $manifest): void
    {
        foreach ((array) ($manifest['file_roots'] ?? []) as $key => $targetRoot) {
            $sourceRoot = $extractPath.DIRECTORY_SEPARATOR.'files'.DIRECTORY_SEPARATOR.$key;

            if (! is_dir($sourceRoot)) {
                continue;
            }

            File::ensureDirectoryExists((string) $targetRoot);
            File::copyDirectory($sourceRoot, (string) $targetRoot);
        }
    }

    private function runRestoreProcess(array $command, string $inputFile): void
    {
        $process = new Process($command, base_path(), null, File::get($inputFile), 300);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException(trim($process->getErrorOutput()) ?: 'Database restore command failed.');
        }
    }
}
