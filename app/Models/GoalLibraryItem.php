<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GoalLibraryItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'department_id',
        'job_title_id',
        'perspective_id',
        'title',
        'description',
        'kpi_measure',
        'target_definition',
        'default_weight',
        'evidence_source',
        'timeline_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_weight' => 'decimal:2',
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

    public function perspective(): BelongsTo
    {
        return $this->belongsTo(Perspective::class);
    }

    public function appraisalObjectives(): HasMany
    {
        return $this->hasMany(AppraisalObjective::class);
    }
}
