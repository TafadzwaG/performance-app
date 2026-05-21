<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AppraisalTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'version',
        'description',
        'department_id',
        'job_title_id',
        'objective_rating_scale_id',
        'competency_rating_scale_id',
        'overall_rating_scale_id',
        'business_weight_percent',
        'values_weight_percent',
        'min_objectives',
        'max_objectives',
        'allow_competencies',
        'is_default',
        'is_protected',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'allow_competencies' => 'boolean',
            'is_default' => 'boolean',
            'is_protected' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function jobTitle(): BelongsTo
    {
        return $this->belongsTo(JobTitle::class);
    }

    public function objectiveRatingScale(): BelongsTo
    {
        return $this->belongsTo(RatingScale::class, 'objective_rating_scale_id');
    }

    public function competencyRatingScale(): BelongsTo
    {
        return $this->belongsTo(RatingScale::class, 'competency_rating_scale_id');
    }

    public function overallRatingScale(): BelongsTo
    {
        return $this->belongsTo(RatingScale::class, 'overall_rating_scale_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(AppraisalTemplateItem::class)->orderBy('sort_order');
    }

    public function appraisals(): HasMany
    {
        return $this->hasMany(Appraisal::class, 'template_id');
    }
}
