<?php

namespace App\Models;

use App\Enums\AppraisalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppraisalStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'appraisal_id',
        'actor_user_id',
        'from_status',
        'to_status',
        'reason',
        'metadata',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'from_status' => AppraisalStatus::class,
            'to_status' => AppraisalStatus::class,
            'metadata' => 'array',
            'changed_at' => 'datetime',
        ];
    }

    public function appraisal(): BelongsTo
    {
        return $this->belongsTo(Appraisal::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
