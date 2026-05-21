<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RatingScaleLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'rating_scale_id',
        'label',
        'description',
        'short_label',
        'value',
        'min_percent',
        'max_percent',
        'color',
        'sort_order',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_percent' => 'decimal:2',
            'max_percent' => 'decimal:2',
            'is_default' => 'boolean',
        ];
    }

    public function ratingScale(): BelongsTo
    {
        return $this->belongsTo(RatingScale::class);
    }

    public function selfObjectiveRatings(): HasMany
    {
        return $this->hasMany(AppraisalObjective::class, 'self_rating_scale_level_id');
    }

    public function managerObjectiveRatings(): HasMany
    {
        return $this->hasMany(AppraisalObjective::class, 'manager_rating_scale_level_id');
    }

    public function selfCompetencyRatings(): HasMany
    {
        return $this->hasMany(AppraisalCompetencyRating::class, 'self_rating_scale_level_id');
    }

    public function managerCompetencyRatings(): HasMany
    {
        return $this->hasMany(AppraisalCompetencyRating::class, 'manager_rating_scale_level_id');
    }

    public function finalRatedAppraisals(): HasMany
    {
        return $this->hasMany(Appraisal::class, 'overall_rating_scale_level_id');
    }
}
