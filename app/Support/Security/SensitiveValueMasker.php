<?php

namespace App\Support\Security;

class SensitiveValueMasker
{
    public static function maskNationalId(?string $value): ?string
    {
        if (! filled($value)) {
            return $value;
        }

        $normalized = preg_replace('/\s+/', '', $value) ?? $value;

        if (strlen($normalized) <= 4) {
            return str_repeat('*', strlen($normalized));
        }

        return str_repeat('*', max(0, strlen($normalized) - 4)).substr($normalized, -4);
    }
}
