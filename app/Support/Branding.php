<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;

class Branding
{
    public static function logoUrl(): ?string
    {
        $file = static::currentLogoFile();

        if (! $file) {
            return null;
        }

        return asset('branding/'.$file.'?v='.filemtime(public_path('branding/'.$file)));
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

    private static function currentLogoFile(): ?string
    {
        $files = glob(public_path('branding/system-logo.*')) ?: [];

        if (count($files) === 0) {
            return null;
        }

        return basename($files[0]);
    }
}
