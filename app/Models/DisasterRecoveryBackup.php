<?php

namespace App\Models;

use App\Enums\DisasterRecovery\BackupStatus;
use App\Enums\DisasterRecovery\BackupTrigger;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisasterRecoveryBackup extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by_user_id',
        'trigger',
        'status',
        'disk',
        'path',
        'filename',
        'size_bytes',
        'checksum',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'trigger' => BackupTrigger::class,
        'status' => BackupStatus::class,
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
