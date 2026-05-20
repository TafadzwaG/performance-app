<?php

namespace App\Services\Settings;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Config;
use Throwable;

class MailSettingsService
{
    public function apply(): void
    {
        try {
            $settings = SystemSetting::query()->first();
        } catch (Throwable) {
            return;
        }

        if (! $settings || ! $settings->mail_notifications_enabled || ! filled($settings->smtp_host)) {
            return;
        }

        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp.host', $settings->smtp_host);
        Config::set('mail.mailers.smtp.port', $settings->smtp_port ?: 587);
        Config::set('mail.mailers.smtp.username', $settings->smtp_username);
        Config::set('mail.mailers.smtp.password', $settings->smtp_password);
        Config::set('mail.mailers.smtp.encryption', $settings->smtp_encryption ?: null);

        if (filled($settings->mail_from_address)) {
            Config::set('mail.from.address', $settings->mail_from_address);
        }

        if (filled($settings->mail_from_name)) {
            Config::set('mail.from.name', $settings->mail_from_name);
        }

        if (filled($settings->mail_reply_to_address)) {
            Config::set('mail.reply_to.address', $settings->mail_reply_to_address);
            Config::set('mail.reply_to.name', $settings->mail_reply_to_name ?: $settings->mail_from_name);
        }
    }
}
