<?php

namespace App\Models;

use App\Enums\CalibrationDecision;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppraisalCalibration extends Model
{
    use HasFactory;

    protected $fillable = [
        'appraisal_id',
        'actor_user_id',
        'decision',
        'original_overall_score',
        'original_overall_rating_scale_level_id',
        'calibrated_overall_score',
        'calibrated_overall_rating_scale_level_id',
        'comments',
        'evidence_summary',
    ];

    protected function casts(): array
    {
        return [
            'decision' => CalibrationDecision::class,
            'original_overall_score' => 'decimal:2',
            'calibrated_overall_score' => 'decimal:2',
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

    public function originalOverallRatingLevel(): BelongsTo
    {
        return $this->belongsTo(RatingScaleLevel::class, 'original_overall_rating_scale_level_id');
    }

    public function calibratedOverallRatingLevel(): BelongsTo
    {
        return $this->belongsTo(RatingScaleLevel::class, 'calibrated_overall_rating_scale_level_id');
    }
}
