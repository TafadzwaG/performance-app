<?php

namespace App\Services\DisasterRecovery;

use App\Enums\DisasterRecovery\BackupStatus;
use App\Enums\DisasterRecovery\RestoreTestStatus;
use App\Models\DisasterRecoveryBackup;
use App\Models\DisasterRecoveryRestoreTest;
use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use PDO;
use Throwable;
use ZipArchive;

class RestoreTestService
{
    public function __construct(private BackupArchiveService $archives) {}

    public function runLatest(): DisasterRecoveryRestoreTest
    {
        $backup = DisasterRecoveryBackup::query()
            ->where('status', BackupStatus::Completed)
            ->latest()
            ->first();

        $test = DisasterRecoveryRestoreTest::query()->create([
            'disaster_recovery_backup_id' => $backup?->id,
            'status' => RestoreTestStatus::Running,
            'started_at' => now(),
            'details' => [
                'target' => (string) config('disaster_recovery.restore_test_path'),
            ],
        ]);

        try {
            if (! $backup) {
                throw new \RuntimeException('No completed backup is available for restore testing.');
            }

            $target = $this->prepareTarget();
            $archive = $this->archives->downloadToLocalPath($backup, $target);
            $extractPath = $this->extractArchive($archive, $target);
            $databaseResult = $this->verifyDatabase($extractPath);
            $fileResult = $this->verifyFiles($extractPath);

            $test->update([
                'status' => RestoreTestStatus::Passed,
                'database_verification_status' => $databaseResult,
                'file_verification_status' => $fileResult,
                'completed_at' => now(),
                'details' => [
                    'target' => $target,
                    'backup_id' => $backup->id,
                ],
            ]);
        } catch (Throwable $exception) {
            $test->update([
                'status' => RestoreTestStatus::Failed,
                'error_message' => $exception->getMessage(),
                'completed_at' => now(),
            ]);

            $this->notifyAdmins($test->refresh());
        }

        return $test->refresh();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function latestResults(): array
    {
        return DisasterRecoveryRestoreTest::query()
            ->with('backup:id,filename,path')
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (DisasterRecoveryRestoreTest $test) => [
                'id' => $test->id,
                'status' => $test->status->value,
                'database_verification_status' => $test->database_verification_status,
                'file_verification_status' => $test->file_verification_status,
                'error_message' => $test->error_message,
                'details' => $test->details,
                'backup' => $test->backup ? [
                    'id' => $test->backup->id,
                    'filename' => $test->backup->filename,
                    'path' => $test->backup->path,
                ] : null,
                'started_at' => $test->started_at?->toDateTimeString(),
                'completed_at' => $test->completed_at?->toDateTimeString(),
            ])
            ->values()
            ->all();
    }

    private function prepareTarget(): string
    {
        $root = (string) config('disaster_recovery.restore_test_path');
        $target = $root.DIRECTORY_SEPARATOR.now()->format('YmdHis').'-'.bin2hex(random_bytes(4));

        File::ensureDirectoryExists($target);

        return $target;
    }

    private function extractArchive(string $archive, string $target): string
    {
        $extractPath = $target.DIRECTORY_SEPARATOR.'extract';
        File::ensureDirectoryExists($extractPath);

        $zip = new ZipArchive();
        if ($zip->open($archive) !== true) {
            throw new \RuntimeException('Unable to open backup archive for restore testing.');
        }

        $zip->extractTo($extractPath);
        $zip->close();

        return $extractPath;
    }

    private function verifyDatabase(string $extractPath): string
    {
        $manifest = $this->manifest($extractPath);
        $database = (array) ($manifest['database'] ?? []);
        $archivePath = str_replace('/', DIRECTORY_SEPARATOR, (string) ($database['archive_path'] ?? ''));
        $databaseFile = $extractPath.DIRECTORY_SEPARATOR.$archivePath;

        if (! is_file($databaseFile)) {
            throw new \RuntimeException('Restore test could not find a database dump in the archive.');
        }

        if (($database['driver'] ?? null) === 'sqlite') {
            $pdo = new PDO('sqlite:'.$databaseFile);
            $tables = $pdo->query("select name from sqlite_master where type = 'table'")
                ?->fetchAll(PDO::FETCH_COLUMN) ?: [];

            foreach ((array) config('disaster_recovery.expected_tables', []) as $table) {
                if (! in_array($table, $tables, true)) {
                    throw new \RuntimeException("Restore test database is missing expected table [{$table}].");
                }
            }
        }

        return 'passed';
    }

    private function verifyFiles(string $extractPath): string
    {
        $filesRoot = $extractPath.DIRECTORY_SEPARATOR.'files';

        if (! is_dir($filesRoot)) {
            throw new \RuntimeException('Restore test could not find file backup contents.');
        }

        return 'passed';
    }

    /**
     * @return array<string, mixed>
     */
    private function manifest(string $extractPath): array
    {
        $manifestPath = $extractPath.DIRECTORY_SEPARATOR.'manifest.json';

        if (! is_file($manifestPath)) {
            throw new \RuntimeException('Restore test could not find backup manifest.');
        }

        return json_decode((string) File::get($manifestPath), true) ?: [];
    }

    private function notifyAdmins(DisasterRecoveryRestoreTest $test): void
    {
        $recipients = User::role('Super Admin')->pluck('email')->filter()->all();
        $configuredRecipient = config('disaster_recovery.notification_email');

        if ($configuredRecipient) {
            $recipients[] = $configuredRecipient;
        }

        foreach (array_unique($recipients) as $email) {
            Mail::raw(
                "A disaster recovery restore test failed.\n\nReason: {$test->error_message}",
                fn ($message) => $message->to($email)->subject('Disaster recovery restore test failed')
            );
        }
    }
}
