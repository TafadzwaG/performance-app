<?php

namespace App\Services\DisasterRecovery;

use App\Enums\DisasterRecovery\BackupStatus;
use App\Enums\DisasterRecovery\BackupTrigger;
use App\Models\DisasterRecoveryBackup;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Throwable;
use ZipArchive;

class BackupArchiveService
{
    public function diskName(): string
    {
        return (string) config('disaster_recovery.disk', 's3');
    }

    public function archivePath(string $trigger, \DateTimeInterface $timestamp): string
    {
        $prefix = trim((string) config('disaster_recovery.path', 'hr-backups'), '/');
        $date = Carbon::instance($timestamp);

        return trim("{$prefix}/{$trigger}/".$date->format('Y/m/d'), '/').'/dr-'.$trigger.'-'.$date->format('Ymd-His').'.zip';
    }

    /**
     * @return list<string>
     */
    public function includedPaths(): array
    {
        return array_values(array_unique(array_map('strval', config('disaster_recovery.included_paths', []))));
    }

    /**
     * @return list<string>
     */
    public function excludedPaths(): array
    {
        return array_values(array_unique(array_map('strval', config('disaster_recovery.excluded_paths', []))));
    }

    public function createQueuedBackup(BackupTrigger $trigger, ?int $createdByUserId = null): DisasterRecoveryBackup
    {
        return DisasterRecoveryBackup::query()->create([
            'created_by_user_id' => $createdByUserId,
            'trigger' => $trigger,
            'status' => BackupStatus::Queued,
            'disk' => $this->diskName(),
        ]);
    }

    public function run(DisasterRecoveryBackup $backup): DisasterRecoveryBackup
    {
        $backup->update([
            'status' => BackupStatus::Running,
            'started_at' => now(),
            'error_message' => null,
            'disk' => $this->diskName(),
        ]);

        $workDirectory = $this->ensureWorkDirectory();
        $archivePath = $this->archivePath($backup->trigger->value, now());
        $localArchive = $workDirectory.DIRECTORY_SEPARATOR.basename($archivePath);

        try {
            $this->buildArchive($localArchive, $backup);

            $stream = fopen($localArchive, 'rb');
            Storage::disk($this->diskName())->put($archivePath, $stream);
            if (is_resource($stream)) {
                fclose($stream);
            }

            $backup->update([
                'status' => BackupStatus::Completed,
                'path' => $archivePath,
                'filename' => basename($archivePath),
                'size_bytes' => filesize($localArchive) ?: 0,
                'checksum' => hash_file('sha256', $localArchive),
                'completed_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $backup->update([
                'status' => BackupStatus::Failed,
                'error_message' => $exception->getMessage(),
                'completed_at' => now(),
            ]);

            throw $exception;
        } finally {
            if (is_file($localArchive)) {
                File::delete($localArchive);
            }
        }

        return $backup->refresh();
    }

    public function downloadToLocalPath(DisasterRecoveryBackup $backup, ?string $targetDirectory = null): string
    {
        if (! $backup->path || ! $backup->disk) {
            throw new \RuntimeException('Backup archive path is missing.');
        }

        $targetDirectory ??= $this->ensureWorkDirectory();
        File::ensureDirectoryExists($targetDirectory);

        $localPath = $targetDirectory.DIRECTORY_SEPARATOR.basename($backup->path);
        $stream = Storage::disk($backup->disk)->readStream($backup->path);

        if (! is_resource($stream)) {
            throw new \RuntimeException('Unable to read backup archive from storage.');
        }

        File::put($localPath, stream_get_contents($stream));
        fclose($stream);

        if ($backup->checksum && hash_file('sha256', $localPath) !== $backup->checksum) {
            File::delete($localPath);
            throw new \RuntimeException('Backup checksum verification failed.');
        }

        return $localPath;
    }

    public function verifyChecksum(DisasterRecoveryBackup $backup): bool
    {
        $localPath = $this->downloadToLocalPath($backup);
        $valid = ! $backup->checksum || hash_file('sha256', $localPath) === $backup->checksum;
        File::delete($localPath);

        return $valid;
    }

    private function buildArchive(string $localArchive, DisasterRecoveryBackup $backup): void
    {
        $zip = new ZipArchive();

        if ($zip->open($localArchive, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Unable to create backup archive.');
        }

        $manifest = [
            'backup_id' => $backup->id,
            'trigger' => $backup->trigger->value,
            'created_at' => now()->toIso8601String(),
            'database_connection' => config('database.default'),
            'file_roots' => [],
        ];

        $this->addDatabaseSnapshot($zip, $manifest);
        $this->addFiles($zip, $manifest);
        $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT));
        $zip->close();
    }

    private function addDatabaseSnapshot(ZipArchive $zip, array &$manifest): void
    {
        $connection = (string) config('database.default');
        $config = (array) config("database.connections.{$connection}", []);

        if (($config['driver'] ?? null) === 'sqlite') {
            $database = (string) ($config['database'] ?? '');
            if ($database !== '' && is_file($database)) {
                $zip->addFile($database, 'database/'.basename($database));
                $manifest['database'] = ['driver' => 'sqlite', 'archive_path' => 'database/'.basename($database)];
                return;
            }
        }

        $dumpPath = $this->dumpSqlDatabase($connection, $config);
        $zip->addFile($dumpPath, 'database/dump.sql');
        $manifest['database'] = ['driver' => $config['driver'] ?? $connection, 'archive_path' => 'database/dump.sql'];
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function dumpSqlDatabase(string $connection, array $config): string
    {
        $driver = (string) ($config['driver'] ?? $connection);
        $dumpPath = $this->ensureWorkDirectory().DIRECTORY_SEPARATOR.'database-'.$connection.'-'.Str::random(8).'.sql';

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $command = [
                'mysqldump',
                '--host='.(string) ($config['host'] ?? '127.0.0.1'),
                '--port='.(string) ($config['port'] ?? '3306'),
                '--user='.(string) ($config['username'] ?? ''),
                '--result-file='.$dumpPath,
                (string) ($config['database'] ?? ''),
            ];

            if (filled($config['password'] ?? null)) {
                array_splice($command, 4, 0, ['--password='.(string) $config['password']]);
            }

            $this->runProcess($command);
            return $dumpPath;
        }

        if ($driver === 'pgsql') {
            $command = [
                'pg_dump',
                '--host='.(string) ($config['host'] ?? '127.0.0.1'),
                '--port='.(string) ($config['port'] ?? '5432'),
                '--username='.(string) ($config['username'] ?? ''),
                '--file='.$dumpPath,
                (string) ($config['database'] ?? ''),
            ];

            $environment = filled($config['password'] ?? null) ? ['PGPASSWORD' => (string) $config['password']] : [];
            $this->runProcess($command, $environment);
            return $dumpPath;
        }

        File::put($dumpPath, "-- Unsupported database driver for automated dump: {$driver}\n");

        return $dumpPath;
    }

    /**
     * @param  array<string, string>  $environment
     */
    private function runProcess(array $command, array $environment = []): void
    {
        $process = new Process($command, base_path(), $environment, null, 300);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException(trim($process->getErrorOutput()) ?: 'Database dump command failed.');
        }
    }

    private function addFiles(ZipArchive $zip, array &$manifest): void
    {
        foreach ($this->includedPaths() as $root) {
            if (! is_dir($root)) {
                continue;
            }

            $realRoot = realpath($root);
            if (! $realRoot) {
                continue;
            }

            $key = Str::slug(basename($realRoot) ?: 'files').'-'.substr(hash('sha1', $realRoot), 0, 8);
            $manifest['file_roots'][$key] = $realRoot;

            foreach (File::allFiles($realRoot) as $file) {
                $path = $file->getPathname();
                if ($this->isExcluded($path)) {
                    continue;
                }

                $relative = ltrim(str_replace('\\', '/', Str::after($path, $realRoot)), '/');
                $zip->addFile($path, "files/{$key}/{$relative}");
            }
        }
    }

    private function isExcluded(string $path): bool
    {
        $path = $this->normalizePath($path);

        foreach ($this->excludedPaths() as $excluded) {
            $excluded = rtrim($this->normalizePath($excluded), '/');
            if ($excluded !== '' && str_starts_with($path, $excluded)) {
                return true;
            }
        }

        return false;
    }

    private function ensureWorkDirectory(): string
    {
        $directory = (string) config('disaster_recovery.work_path', storage_path('app/disaster-recovery/work'));
        File::ensureDirectoryExists($directory);

        return $directory;
    }

    private function normalizePath(string $path): string
    {
        return str_replace('\\', '/', realpath($path) ?: $path);
    }
}
