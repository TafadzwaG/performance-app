<?php

namespace App\Support;

use App\Models\SystemSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;

class Branding
{
    public static function logoUrl(): ?string
    {
        $path = static::logoAbsolutePath();

        if ($path === null) {
            return null;
        }

        return asset('branding/'.basename($path).'?v='.filemtime($path));
    }

    public static function logoAbsolutePath(): ?string
    {
        $files = glob(public_path('branding/system-logo.*')) ?: [];

        if (count($files) === 0) {
            return null;
        }

        return $files[0];
    }

    public static function logoDataUri(): ?string
    {
        return static::imageDataUriForPath(static::logoAbsolutePath());
    }

    public static function poweredByDataUri(): ?string
    {
        return static::imageDataUriForPath(static::poweredByPath());
    }

    public static function imageDataUriForPath(?string $path): ?string
    {
        if ($path === null || ! file_exists($path)) {
            return null;
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mime = match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'image/png',
        };

        return 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($path));
    }

    /**
     * DomPDF-friendly image source: embedded data URI first, then a chroot-relative path.
     */
    public static function pdfImageSrc(?string $path): ?string
    {
        if ($path === null || ! file_exists($path)) {
            return null;
        }

        $dataUri = static::imageDataUriForPath($path);

        if ($dataUri !== null) {
            return $dataUri;
        }

        $basePath = str_replace('\\', '/', (string) realpath(base_path()));
        $absolutePath = str_replace('\\', '/', (string) realpath($path));

        if ($basePath !== '' && str_starts_with($absolutePath, $basePath.'/')) {
            return substr($absolutePath, strlen($basePath) + 1);
        }

        return $absolutePath;
    }

    /**
     * Bust browser caches for branded exports when settings or logo change.
     */
    public static function exportRevision(): int
    {
        $settings = SystemSetting::query()->first();
        $settingsTimestamp = $settings?->updated_at?->getTimestamp() ?? 0;
        $logoPath = static::logoAbsolutePath();
        $logoTimestamp = ($logoPath !== null && file_exists($logoPath)) ? (int) filemtime($logoPath) : 0;

        return max($settingsTimestamp, $logoTimestamp, 1);
    }

    /**
     * @return array{
     *     settings: SystemSetting,
     *     logoPath: ?string,
     *     logoUrl: ?string,
     *     logoDataUri: ?string,
     *     logoPdfSrc: ?string,
     *     logoExists: bool,
     *     poweredByPath: ?string,
     *     poweredByUrl: ?string,
     *     poweredByDataUri: ?string,
     *     poweredByPdfSrc: ?string,
     *     poweredByExists: bool,
     *     companyName: string,
     *     companyAddress: ?string,
     *     reportFooter: ?string
     * }
     */
    public static function exportHeaderContext(): array
    {
        $settings = SystemSetting::current();
        $logoPath = static::logoAbsolutePath();
        $poweredByPath = static::poweredByPath();

        return [
            'settings' => $settings,
            'logoPath' => $logoPath,
            'logoUrl' => static::logoUrl(),
            'logoDataUri' => static::logoDataUri(),
            'logoPdfSrc' => static::pdfImageSrc($logoPath),
            'logoExists' => $logoPath !== null && File::exists($logoPath),
            'poweredByPath' => $poweredByPath,
            'poweredByUrl' => $poweredByPath ? asset('branding/tjt-logo.png') : null,
            'poweredByDataUri' => static::poweredByDataUri(),
            'poweredByPdfSrc' => static::pdfImageSrc($poweredByPath),
            'poweredByExists' => $poweredByPath !== null,
            'companyName' => filled($settings->company_name)
                ? $settings->company_name
                : 'Performance Appraisal Studio',
            'companyAddress' => $settings->formattedAddress(),
            'reportFooter' => $settings->report_footer,
        ];
    }

    /**
     * Absolute filesystem path to the "Powered by TJT" lock-up used in PDF
     * exports. Returns null if the file is missing.
     */
    public static function poweredByPath(): ?string
    {
        $path = public_path('branding/tjt-logo.png');

        return file_exists($path) ? $path : null;
    }

    public static function updateLogo(UploadedFile $file): void
    {
        $directory = public_path('branding');

        if (! File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        foreach (glob($directory.'/system-logo.*') ?: [] as $existing) {
            File::delete($existing);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
        $filename = 'system-logo.'.$extension;

        $file->move($directory, $filename);
    }

    public static function removeLogo(): void
    {
        foreach (glob(public_path('branding/system-logo.*')) ?: [] as $existing) {
            File::delete($existing);
        }
    }
}
