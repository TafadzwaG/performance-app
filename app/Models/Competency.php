<?php

namespace App\Models;

use App\Enums\CompetencyCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Competency extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'category',
        'department_id',
        'job_title_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'category' => CompetencyCategory::class,
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

    public function appraisalCompetencyRatings(): HasMany
    {
        return $this->hasMany(AppraisalCompetencyRating::class);
    }

    public function templateItems(): HasMany
    {
        return $this->hasMany(AppraisalTemplateItem::class);
    }
}
