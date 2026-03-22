<?php

namespace App\Models;

use App\Enums\DevelopmentActionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevelopmentPlanAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'development_plan_id',
        'action',
        'owner_user_id',
        'due_date',
        'status',
        'follow_up_status',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => DevelopmentActionStatus::class,
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function developmentPlan(): BelongsTo
    {
        return $this->belongsTo(DevelopmentPlan::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }
}
