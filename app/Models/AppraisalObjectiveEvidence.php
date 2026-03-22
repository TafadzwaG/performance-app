<?php

namespace App\Models;

use App\Enums\EvidenceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppraisalObjectiveEvidence extends Model
{
    use HasFactory;

    protected $table = 'appraisal_objective_evidence';

    protected $fillable = [
        'appraisal_objective_id',
        'uploaded_by_user_id',
        'evidence_type',
        'disk',
        'path',
        'url',
        'original_name',
        'mime_type',
        'size',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'evidence_type' => EvidenceType::class,
        ];
    }

    public function objective(): BelongsTo
    {
        return $this->belongsTo(AppraisalObjective::class, 'appraisal_objective_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
