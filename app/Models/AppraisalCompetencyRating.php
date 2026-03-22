<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppraisalCompetencyRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'appraisal_id',
        'competency_id',
        'self_rating_scale_level_id',
        'self_rating_score',
        'manager_rating_scale_level_id',
        'manager_rating_score',
        'employee_comment',
        'manager_comment',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'self_rating_score' => 'decimal:2',
            'manager_rating_score' => 'decimal:2',
        ];
    }

    public function appraisal(): BelongsTo
    {
        return $this->belongsTo(Appraisal::class);
    }

    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class);
    }

    public function selfRatingLevel(): BelongsTo
    {
        return $this->belongsTo(RatingScaleLevel::class, 'self_rating_scale_level_id');
    }

    public function managerRatingLevel(): BelongsTo
    {
        return $this->belongsTo(RatingScaleLevel::class, 'manager_rating_scale_level_id');
    }
}
