<?php

namespace App\Models;

use App\Enums\ApprovalAction;
use App\Enums\ApprovalStage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppraisalApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'appraisal_id',
        'actor_user_id',
        'stage',
        'action',
        'comments',
        'snapshot',
        'acted_at',
    ];

    protected function casts(): array
    {
        return [
            'stage' => ApprovalStage::class,
            'action' => ApprovalAction::class,
            'snapshot' => 'array',
            'acted_at' => 'datetime',
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
