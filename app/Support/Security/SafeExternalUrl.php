<?php

namespace App\Support\Security;

class SafeExternalUrl
{
    public static function isAllowed(?string $url): bool
    {
        if (! filled($url)) {
            return false;
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true);
    }
}
