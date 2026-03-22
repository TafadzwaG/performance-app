<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DevelopmentPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'appraisal_id',
        'strengths',
        'improvement_areas',
        'follow_up_notes',
    ];

    public function appraisal(): BelongsTo
    {
        return $this->belongsTo(Appraisal::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(DevelopmentPlanAction::class);
    }
}
