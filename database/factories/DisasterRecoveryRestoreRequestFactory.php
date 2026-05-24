<?php

namespace Database\Factories;

use App\Enums\DisasterRecovery\RestoreRequestStatus;
use App\Models\DisasterRecoveryBackup;
use App\Models\DisasterRecoveryRestoreRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DisasterRecoveryRestoreRequest>
 */
class DisasterRecoveryRestoreRequestFactory extends Factory
{
    protected $model = DisasterRecoveryRestoreRequest::class;

    public function definition(): array
    {
        return [
            'disaster_recovery_backup_id' => DisasterRecoveryBackup::factory(),
            'requested_by_user_id' => User::factory(),
            'status' => RestoreRequestStatus::PendingApproval,
            'notes' => null,
        ];
    }
}
