<?php

namespace App\Models;

use App\Enums\DisasterRecovery\RestoreRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisasterRecoveryRestoreRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'disaster_recovery_backup_id',
        'pre_restore_backup_id',
        'requested_by_user_id',
        'approved_by_user_id',
        'status',
        'confirmation_phrase',
        'notes',
        'rejection_reason',
        'error_message',
        'approved_at',
        'rejected_at',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'status' => RestoreRequestStatus::class,
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function backup(): BelongsTo
    {
        return $this->belongsTo(DisasterRecoveryBackup::class, 'disaster_recovery_backup_id');
    }

    public function preRestoreBackup(): BelongsTo
    {
        return $this->belongsTo(DisasterRecoveryBackup::class, 'pre_restore_backup_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
