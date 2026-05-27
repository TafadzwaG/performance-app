<?php

namespace App\Support\Notifications;

use App\Models\SystemSetting;
use Throwable;

class PerformanceNotificationChannels
{
    /**
     * @return list<string>
     */
    public static function forAppraisalWorkflow(bool $includeDatabase = true): array
    {
        $channels = $includeDatabase ? ['database'] : [];

        if (self::mailEnabled()) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public static function mailEnabled(): bool
    {
        try {
            $settings = SystemSetting::query()->first();
        } catch (Throwable) {
            return false;
        }

        return (bool) ($settings?->mail_notifications_enabled && filled($settings?->smtp_host));
    }
}
