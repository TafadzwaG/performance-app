<?php

namespace App\Models;

use App\Enums\TemplateItemType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AppraisalTemplateItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'appraisal_template_id',
        'item_type',
        'perspective_id',
        'competency_id',
        'title',
        'description',
        'default_weight',
        'evidence_source_hint',
        'sort_order',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'item_type' => TemplateItemType::class,
            'default_weight' => 'decimal:2',
            'is_required' => 'boolean',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(AppraisalTemplate::class, 'appraisal_template_id');
    }

    public function perspective(): BelongsTo
    {
        return $this->belongsTo(Perspective::class);
    }

    public function competency(): BelongsTo
    {
        return $this->belongsTo(Competency::class);
    }

    public function appraisalObjectives(): HasMany
    {
        return $this->hasMany(AppraisalObjective::class, 'template_item_id');
    }
}
