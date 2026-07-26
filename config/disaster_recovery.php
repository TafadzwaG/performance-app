<?php

return [
    'disk' => env('DR_BACKUP_DISK', 'dr_backups'),
    'path' => trim((string) env('DR_BACKUP_PATH', 'hr-backups'), '/'),
    'notification_email' => env('DR_NOTIFICATION_EMAIL', env('MAIL_FROM_ADDRESS')),
    'restore_confirmation_phrase' => env('DR_RESTORE_CONFIRMATION_PHRASE', 'RESTORE PRODUCTION'),
    'work_path' => storage_path('app/disaster-recovery/work'),
    'restore_test_path' => storage_path('app/disaster-recovery/restore-tests'),
    'keep_app_down_on_restore_failure' => (bool) env('DR_KEEP_APP_DOWN_ON_RESTORE_FAILURE', false),

    'included_paths' => [
        storage_path('app/private'),
        storage_path('app/public'),
        storage_path('app/exports'),
        storage_path('app/imports'),
        public_path('branding'),
    ],

    'excluded_paths' => [
        storage_path('framework/cache'),
        storage_path('framework/sessions'),
        storage_path('framework/testing'),
        storage_path('framework/views'),
        storage_path('logs'),
        storage_path('app/disaster-recovery'),
        storage_path('app/backup-temp'),
    ],

    'expected_tables' => [
        'users',
        'roles',
        'permissions',
        'employee_profiles',
        'system_settings',
    ],

    'retention' => [
        'daily' => (int) env('DR_KEEP_DAILY_BACKUPS', 7),
        'weekly' => (int) env('DR_KEEP_WEEKLY_BACKUPS', 4),
        'monthly' => (int) env('DR_KEEP_MONTHLY_BACKUPS', 12),
    ],
];
