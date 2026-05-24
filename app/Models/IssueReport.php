<?php

namespace App\Models;

use App\Enums\IssueStatus;
use App\Enums\IssueType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IssueReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_user_id',
        'assignee_user_id',
        'type',
        'title',
        'description',
        'status',
    ];

    protected $appends = [
        'reference',
    ];

    protected function casts(): array
    {
        return [
            'type' => IssueType::class,
            'status' => IssueStatus::class,
        ];
    }

    public function getReferenceAttribute(): string
    {
        return 'ISS-'.str_pad((string) $this->id, 5, '0', STR_PAD_LEFT);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_user_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_user_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(IssueStatusHistory::class)->latest();
    }
}
