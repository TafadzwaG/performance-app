<?php

namespace App\Services\DisasterRecovery;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\UnableToCheckFileExistence;
use Throwable;

class BackupStorage
{
    public static function exists(?string $disk, ?string $path): bool
    {
        if (! $disk || ! $path) {
            return false;
        }

        try {
            return Storage::disk($disk)->exists($path);
        } catch (UnableToCheckFileExistence $exception) {
            self::logExistenceFailure($disk, $path, $exception);

            return false;
        } catch (Throwable $exception) {
            self::logExistenceFailure($disk, $path, $exception);

            return false;
        }
    }

    private static function logExistenceFailure(string $disk, string $path, Throwable $exception): void
    {
        Log::warning('Unable to check disaster recovery backup existence.', [
            'disk' => $disk,
            'path' => $path,
            'message' => $exception->getMessage(),
        ]);
    }
}
