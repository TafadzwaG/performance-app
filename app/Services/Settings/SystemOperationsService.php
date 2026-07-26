<?php

namespace App\Services\Settings;

use App\Support\FormatBytes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SystemOperationsService
{
    /**
     * @return array<string, mixed>
     */
    public function snapshot(): array
    {
        return [
            'queue' => $this->queueOverview(),
            'storage' => $this->storageOverview(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function storageOverview(): array
    {
        $zones = [];

        foreach ($this->fileZones() as $key => $zone) {
            [$fileCount, $sizeBytes] = $this->zoneStats($key);

            $zones[] = [
                'key' => $key,
                'label' => $zone['label'],
                'description' => $zone['description'],
                'file_count' => $fileCount,
                'size_bytes' => $sizeBytes,
                'size_human' => FormatBytes::format($sizeBytes),
            ];
        }

        $totalBytes = array_sum(array_column($zones, 'size_bytes'));

        return [
            'default_disk' => (string) config('filesystems.default'),
            'zones' => $zones,
            'total_size_bytes' => $totalBytes,
            'total_size_human' => FormatBytes::format($totalBytes),
            'storage_linked' => is_link(public_path('storage')),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function filesOverview(?string $zone, ?string $path, bool $listAll = false): array
    {
        $zone = $this->resolveZoneKey($zone);
        $path = $path !== null && $path !== '' ? $path : null;

        if ($listAll) {
            $path = null;
        }

        $entries = $listAll
            ? $this->listAllZoneFiles($zone)
            : $this->listZoneEntries($zone, $path);

        return [
            'zone' => $zone,
            'path' => $path ?? '',
            'list_all' => $listAll,
            'breadcrumbs' => $this->breadcrumbsFor($zone, $path, $listAll),
            'zones' => collect($this->fileZones())
                ->map(fn (array $meta, string $key) => [
                    'key' => $key,
                    'label' => $meta['label'],
                ])
                ->values()
                ->all(),
            'entries' => $entries,
        ];
    }

    public function absoluteFilePath(string $zone, string $relativePath): string
    {
        $absolute = $this->absolutePathFor($this->resolveZoneKey($zone), $relativePath);

        if (! $absolute || ! is_file($absolute)) {
            abort(404, 'File not found.');
        }

        return $absolute;
    }

    /**
     * @return array<string, mixed>
     */
    private function queueOverview(): array
    {
        $connection = (string) config('queue.default');
        $hasJobsTable = Schema::hasTable('jobs');
        $hasFailedJobsTable = Schema::hasTable('failed_jobs');

        $pending = $hasJobsTable
            ? (int) DB::table('jobs')->count()
            : 0;

        $failed = $hasFailedJobsTable
            ? (int) DB::table('failed_jobs')->count()
            : 0;

        $pendingJobs = $hasJobsTable
            ? DB::table('jobs')
                ->orderByDesc('id')
                ->limit(25)
                ->get()
                ->map(fn ($job) => $this->formatPendingJob($job))
                ->all()
            : [];

        $failedJobs = $hasFailedJobsTable
            ? DB::table('failed_jobs')
                ->orderByDesc('failed_at')
                ->limit(25)
                ->get()
                ->map(fn ($job) => $this->formatFailedJob($job))
                ->all()
            : [];

        return [
            'connection' => $connection,
            'driver' => (string) config("queue.connections.{$connection}.driver", $connection),
            'pending_count' => $pending,
            'failed_count' => $failed,
            'pending_jobs' => $pendingJobs,
            'failed_jobs' => $failedJobs,
            'worker_command' => 'php artisan queue:work',
            'tables_ready' => $hasJobsTable && $hasFailedJobsTable,
        ];
    }

    /**
     * @return array<string, array{label: string, description: string}>
     */
    public function fileZones(): array
    {
        return [
            'imports' => [
                'label' => 'Employee imports',
                'description' => 'Temporary upload files during employee bulk import.',
            ],
            'exports' => [
                'label' => 'Generated exports',
                'description' => 'Spreadsheet and report export files.',
            ],
            'evidence' => [
                'label' => 'Objective evidence',
                'description' => 'Files uploaded against appraisal objectives.',
            ],
            'calibration' => [
                'label' => 'Calibration evidence',
                'description' => 'Supporting files attached during calibration.',
            ],
            'branding' => [
                'label' => 'Branding assets',
                'description' => 'Uploaded company logos in public branding.',
            ],
        ];
    }

    public function resolveZoneKey(?string $zone): string
    {
        $zone = $zone ?: 'imports';

        return array_key_exists($zone, $this->fileZones()) ? $zone : 'imports';
    }

    public function deleteFile(string $zone, string $relativePath): void
    {
        $zone = $this->resolveZoneKey($zone);
        $relativePath = trim(str_replace('\\', '/', $relativePath), '/');

        if ($relativePath === '' || str_contains($relativePath, '..')) {
            abort(422, 'Invalid file path.');
        }

        $absolute = $this->absolutePathFor($zone, $relativePath);

        if (! $absolute || ! is_file($absolute)) {
            abort(404, 'File not found.');
        }

        File::delete($absolute);
    }

    public function purgeZone(string $zone): int
    {
        $zone = $this->resolveZoneKey($zone);
        $deleted = 0;

        foreach ($this->walkZone($zone) as $file) {
            if (is_file($file)) {
                File::delete($file);
                $deleted++;
            }
        }

        return $deleted;
    }

    public function retryFailedJob(int $id): void
    {
        if (! Schema::hasTable('failed_jobs') || ! DB::table('failed_jobs')->where('id', $id)->exists()) {
            abort(404, 'Failed job not found.');
        }

        Artisan::call('queue:retry', ['id' => [$id]]);
    }

    public function forgetFailedJob(int $id): void
    {
        if (! Schema::hasTable('failed_jobs') || ! DB::table('failed_jobs')->where('id', $id)->exists()) {
            abort(404, 'Failed job not found.');
        }

        Artisan::call('queue:forget', ['id' => $id]);
    }

    public function flushFailedJobs(): int
    {
        if (! Schema::hasTable('failed_jobs')) {
            return 0;
        }

        $count = (int) DB::table('failed_jobs')->count();

        Artisan::call('queue:flush');

        return $count;
    }

    public function deletePendingJob(int $id): void
    {
        if (! Schema::hasTable('jobs')) {
            abort(404, 'Jobs table not available.');
        }

        $deleted = DB::table('jobs')->where('id', $id)->delete();

        if ($deleted === 0) {
            abort(404, 'Pending job not found.');
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function listAllZoneFiles(string $zone): array
    {
        $root = $this->zoneRoot($zone);

        if (! $root) {
            return [];
        }

        $realRoot = realpath($root);

        if (! $realRoot) {
            return [];
        }

        $entries = [];

        foreach ($this->walkZone($zone) as $absolutePath) {
            if (! is_file($absolutePath)) {
                continue;
            }

            $relativePath = $this->relativePathFromRoot($realRoot, $absolutePath);

            if ($relativePath === '') {
                continue;
            }

            $entries[] = $this->formatFileEntry($zone, $relativePath, $absolutePath);
        }

        usort($entries, fn (array $a, array $b) => strcasecmp($a['path'], $b['path']));

        return $entries;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatFileEntry(string $zone, string $relativePath, string $absolutePath): array
    {
        $size = (int) filesize($absolutePath);

        $downloadParams = [
            'zone' => $zone,
            'path' => $relativePath,
        ];

        return [
            'type' => 'file',
            'name' => basename($relativePath),
            'path' => $relativePath,
            'size_bytes' => $size,
            'size_human' => FormatBytes::format($size),
            'modified_at' => Carbon::createFromTimestamp(filemtime($absolutePath))->toDateTimeString(),
            'download_url' => Route::has('access.storage.download')
                ? route('access.storage.download', $downloadParams)
                : null,
            'view_url' => Route::has('access.storage.download')
                ? route('access.storage.download', [...$downloadParams, 'inline' => 1])
                : null,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function listZoneEntries(string $zone, ?string $path): array
    {
        $path = trim(str_replace('\\', '/', (string) $path), '/');

        if ($path !== '' && str_contains($path, '..')) {
            return [];
        }

        $directory = $this->directoryFor($zone, $path);

        if (! $directory || ! is_dir($directory)) {
            return [];
        }

        $entries = [];

        if ($path !== '') {
            $parent = Str::beforeLast($path, '/');

            $entries[] = [
                'type' => 'directory',
                'name' => '..',
                'path' => $parent,
                'size_bytes' => null,
                'size_human' => null,
                'modified_at' => null,
            ];
        }

        foreach (File::directories($directory) as $dir) {
            $name = basename($dir);
            $entries[] = [
                'type' => 'directory',
                'name' => $name,
                'path' => $path === '' ? $name : "{$path}/{$name}",
                'size_bytes' => null,
                'size_human' => null,
                'modified_at' => Carbon::createFromTimestamp(filemtime($dir))->toDateTimeString(),
            ];
        }

        foreach (File::files($directory) as $file) {
            $name = $file->getFilename();
            $size = $file->getSize();

            $relativePath = $path === '' ? $name : "{$path}/{$name}";

            $entries[] = $this->formatFileEntry($zone, $relativePath, $file->getPathname());
        }

        usort($entries, function (array $a, array $b): int {
            if ($a['name'] === '..') {
                return -1;
            }

            if ($b['name'] === '..') {
                return 1;
            }

            if ($a['type'] !== $b['type']) {
                return $a['type'] === 'directory' ? -1 : 1;
            }

            return strcasecmp($a['name'], $b['name']);
        });

        return $entries;
    }

    /**
     * @return list<array{label: string, path: string|null}>
     */
    /**
     * @return list<array{label: string, path: string|null, list_all?: bool}>
     */
    private function breadcrumbsFor(string $zone, ?string $path, bool $listAll = false): array
    {
        $path = trim((string) $path, '/');
        $crumbs = [
            ['label' => $this->fileZones()[$zone]['label'], 'path' => null, 'list_all' => true],
        ];

        if ($listAll) {
            $crumbs[] = ['label' => 'All files', 'path' => null, 'list_all' => true];

            return $crumbs;
        }

        if ($path === '') {
            return $crumbs;
        }

        $segments = explode('/', $path);
        $built = '';

        foreach ($segments as $segment) {
            $built = $built === '' ? $segment : "{$built}/{$segment}";
            $crumbs[] = ['label' => $segment, 'path' => $built];
        }

        return $crumbs;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatPendingJob(object $job): array
    {
        $payload = json_decode($job->payload, true) ?? [];

        return [
            'id' => $job->id,
            'queue' => $job->queue,
            'name' => $this->resolveJobName($payload),
            'attempts' => $job->attempts,
            'reserved' => $job->reserved_at !== null,
            'available_at' => Carbon::createFromTimestamp($job->available_at)->toDateTimeString(),
            'created_at' => Carbon::createFromTimestamp($job->created_at)->toDateTimeString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatFailedJob(object $job): array
    {
        $payload = json_decode($job->payload, true) ?? [];

        return [
            'id' => $job->id,
            'uuid' => $job->uuid,
            'queue' => $job->queue,
            'connection' => $job->connection,
            'name' => $this->resolveJobName($payload),
            'exception' => Str::limit((string) $job->exception, 240),
            'failed_at' => Carbon::parse($job->failed_at)->toDateTimeString(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveJobName(array $payload): string
    {
        if (isset($payload['displayName']) && is_string($payload['displayName'])) {
            return class_basename($payload['displayName']);
        }

        $commandName = $payload['data']['commandName'] ?? null;

        if (is_string($commandName) && $commandName !== '') {
            return class_basename($commandName);
        }

        return 'Queued job';
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function zoneStats(string $zone): array
    {
        $fileCount = 0;
        $sizeBytes = 0;

        foreach ($this->walkZone($zone) as $path) {
            if (! is_file($path)) {
                continue;
            }

            $fileCount++;
            $sizeBytes += (int) filesize($path);
        }

        return [$fileCount, $sizeBytes];
    }

    /**
     * @return list<string>
     */
    private function walkZone(string $zone): array
    {
        $root = $this->zoneRoot($zone);

        if (! $root || ! is_dir($root)) {
            return [];
        }

        $files = [];

        foreach (File::allFiles($root) as $file) {
            $files[] = $file->getPathname();
        }

        return $files;
    }

    private function directoryFor(string $zone, string $path): ?string
    {
        $root = $this->zoneRoot($zone);

        if (! $root) {
            return null;
        }

        $target = $path === '' ? $root : $root.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $path);

        $realRoot = realpath($root);
        $realTarget = realpath($target);

        if (! $realRoot || ! $realTarget || ! str_starts_with($realTarget, $realRoot)) {
            return null;
        }

        return is_dir($realTarget) ? $realTarget : null;
    }

    private function absolutePathFor(string $zone, string $relativePath): ?string
    {
        $root = $this->zoneRoot($zone);

        if (! $root) {
            return null;
        }

        $target = $root.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
        $realRoot = realpath($root);
        $realTarget = realpath($target);

        if (! $realRoot || ! $realTarget || ! str_starts_with($realTarget, $realRoot)) {
            return null;
        }

        return $realTarget;
    }

    private function zoneRoot(string $zone): ?string
    {
        return match ($zone) {
            'imports' => Storage::disk('local')->path('imports'),
            'exports' => storage_path('app/exports'),
            'evidence' => Storage::disk('public')->path('performance/evidence'),
            'calibration' => Storage::disk('public')->path('performance/calibration-evidence'),
            'branding' => public_path('branding'),
            default => null,
        };
    }

    private function relativePathFromRoot(string $root, string $absolutePath): string
    {
        $rootPrefix = rtrim(str_replace('\\', '/', realpath($root) ?: $root), '/').'/';
        $absolute = str_replace('\\', '/', realpath($absolutePath) ?: $absolutePath);

        if (! str_starts_with($absolute, $rootPrefix)) {
            return '';
        }

        return trim(Str::after($absolute, $rootPrefix), '/');
    }
}
