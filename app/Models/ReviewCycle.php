<?php

namespace App\Models;

use App\Enums\ReviewCycleStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReviewCycle extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'start_date',
        'end_date',
        'goal_setting_deadline',
        'self_assessment_deadline',
        'manager_review_deadline',
        'approval_deadline',
        'template_id',
        'status',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'goal_setting_deadline' => 'date',
            'self_assessment_deadline' => 'date',
            'manager_review_deadline' => 'date',
            'approval_deadline' => 'date',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'status' => ReviewCycleStatus::class,
        ];
    }

    public function appraisals(): HasMany
    {
        return $this->hasMany(Appraisal::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(AppraisalTemplate::class, 'template_id');
    }
}
