<?php

namespace App\Support\Tenancy;

class TenantAwareUrl
{
    public static function forOrganization(int $organizationId, string $target): string
    {
        $path = parse_url($target, PHP_URL_PATH) ?: '/dashboard';
        $query = parse_url($target, PHP_URL_QUERY);

        return route('organizations.activate', [
            'organization' => $organizationId,
            'redirect' => $path.($query ? '?'.$query : ''),
        ]);
    }
}
