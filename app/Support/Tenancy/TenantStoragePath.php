<?php

namespace App\Support\Tenancy;

use App\Tenancy\TenantContext;
use Illuminate\Support\Facades\Auth;

class TenantStoragePath
{
    public static function exportDirectory(): string
    {
        $organizationId = app(TenantContext::class)->requireId();
        $userId = Auth::id() ?? 'system';

        return storage_path("app/organizations/{$organizationId}/exports/{$userId}");
    }

    public static function export(string $filename): string
    {
        return static::exportDirectory().DIRECTORY_SEPARATOR.basename($filename);
    }

    public static function privateImport(string $category, string $filename): string
    {
        $organizationId = app(TenantContext::class)->requireId();

        return "organizations/{$organizationId}/imports/{$category}/".basename($filename);
    }
}
