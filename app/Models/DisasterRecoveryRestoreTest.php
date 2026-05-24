<?php

namespace App\Models;

use App\Enums\DisasterRecovery\RestoreTestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisasterRecoveryRestoreTest extends Model
{
    use HasFactory;

    protected $fillable = [
        'disaster_recovery_backup_id',
        'status',
        'database_verification_status',
        'file_verification_status',
        'details',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'status' => RestoreTestStatus::class,
        'details' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function backup(): BelongsTo
    {
        return $this->belongsTo(DisasterRecoveryBackup::class, 'disaster_recovery_backup_id');
    }
}
