<?php

namespace Database\Factories;

use App\Enums\DisasterRecovery\BackupStatus;
use App\Enums\DisasterRecovery\BackupTrigger;
use App\Models\DisasterRecoveryBackup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DisasterRecoveryBackup>
 */
class DisasterRecoveryBackupFactory extends Factory
{
    protected $model = DisasterRecoveryBackup::class;

    public function definition(): array
    {
        return [
            'trigger' => BackupTrigger::Manual,
            'status' => BackupStatus::Queued,
            'disk' => config('disaster_recovery.disk', 's3'),
            'path' => null,
            'filename' => null,
            'size_bytes' => null,
            'checksum' => null,
        ];
    }
}
