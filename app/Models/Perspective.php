<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Perspective extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function goalLibraryItems(): HasMany
    {
        return $this->hasMany(GoalLibraryItem::class);
    }

    public function appraisalObjectives(): HasMany
    {
        return $this->hasMany(AppraisalObjective::class);
    }

    public function templateItems(): HasMany
    {
        return $this->hasMany(AppraisalTemplateItem::class);
    }
}
