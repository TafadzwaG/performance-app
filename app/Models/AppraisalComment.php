<?php

namespace App\Models;

use App\Enums\CommentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppraisalComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appraisal_id',
        'appraisal_objective_id',
        'author_user_id',
        'comment_type',
        'body',
    ];

    protected function casts(): array
    {
        return [
            'comment_type' => CommentType::class,
        ];
    }

    public function appraisal(): BelongsTo
    {
        return $this->belongsTo(Appraisal::class);
    }

    public function objective(): BelongsTo
    {
        return $this->belongsTo(AppraisalObjective::class, 'appraisal_objective_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }
}
