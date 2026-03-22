<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AppraisalObjective extends Model
{
    use HasFactory;

    protected $fillable = [
        'appraisal_id',
        'template_item_id',
        'goal_library_item_id',
        'perspective_id',
        'objective_type',
        'title',
        'kpi_measure',
        'target_definition',
        'weight',
        'evidence_source',
        'due_date',
        'performance_achieved',
        'employee_comment',
        'manager_comment',
        'self_rating_scale_level_id',
        'self_rating_score',
        'manager_rating_scale_level_id',
        'manager_rating_score',
        'include_in_business_score',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'decimal:2',
            'self_rating_score' => 'decimal:2',
            'manager_rating_score' => 'decimal:2',
            'include_in_business_score' => 'boolean',
            'due_date' => 'date',
        ];
    }

    public function appraisal(): BelongsTo
    {
        return $this->belongsTo(Appraisal::class);
    }

    public function templateItem(): BelongsTo
    {
        return $this->belongsTo(AppraisalTemplateItem::class, 'template_item_id');
    }

    public function goalLibraryItem(): BelongsTo
    {
        return $this->belongsTo(GoalLibraryItem::class);
    }

    public function perspective(): BelongsTo
    {
        return $this->belongsTo(Perspective::class);
    }

    public function selfRatingLevel(): BelongsTo
    {
        return $this->belongsTo(RatingScaleLevel::class, 'self_rating_scale_level_id');
    }

    public function managerRatingLevel(): BelongsTo
    {
        return $this->belongsTo(RatingScaleLevel::class, 'manager_rating_scale_level_id');
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(AppraisalObjectiveEvidence::class);
    }
}
