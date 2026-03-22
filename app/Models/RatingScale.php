<?php

namespace App\Models;

use App\Enums\RatingScaleType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RatingScale extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'applies_to',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'applies_to' => RatingScaleType::class,
            'is_active' => 'boolean',
        ];
    }

    public function levels(): HasMany
    {
        return $this->hasMany(RatingScaleLevel::class)->orderBy('sort_order');
    }

    public function objectiveTemplates(): HasMany
    {
        return $this->hasMany(AppraisalTemplate::class, 'objective_rating_scale_id');
    }

    public function competencyTemplates(): HasMany
    {
        return $this->hasMany(AppraisalTemplate::class, 'competency_rating_scale_id');
    }

    public function overallTemplates(): HasMany
    {
        return $this->hasMany(AppraisalTemplate::class, 'overall_rating_scale_id');
    }
}
