<?php

namespace Database\Factories;

use App\Enums\DisasterRecovery\RestoreTestStatus;
use App\Models\DisasterRecoveryBackup;
use App\Models\DisasterRecoveryRestoreTest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DisasterRecoveryRestoreTest>
 */
class DisasterRecoveryRestoreTestFactory extends Factory
{
    protected $model = DisasterRecoveryRestoreTest::class;

    public function definition(): array
    {
        return [
            'disaster_recovery_backup_id' => DisasterRecoveryBackup::factory(),
            'status' => RestoreTestStatus::Running,
            'database_verification_status' => null,
            'file_verification_status' => null,
            'details' => [],
        ];
    }
}
