<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function employeeProfiles(): HasMany
    {
        return $this->hasMany(EmployeeProfile::class);
    }

    public function goalLibraryItems(): HasMany
    {
        return $this->hasMany(GoalLibraryItem::class);
    }

    public function appraisalTemplates(): HasMany
    {
        return $this->hasMany(AppraisalTemplate::class);
    }

    public function competencies(): HasMany
    {
        return $this->hasMany(Competency::class);
    }
}
