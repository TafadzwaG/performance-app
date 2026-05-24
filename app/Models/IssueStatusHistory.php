<?php

namespace App\Models;

use App\Enums\IssueStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IssueStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'issue_report_id',
        'actor_user_id',
        'from_status',
        'to_status',
        'from_assignee_user_id',
        'to_assignee_user_id',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'from_status' => IssueStatus::class,
            'to_status' => IssueStatus::class,
        ];
    }

    public function issueReport(): BelongsTo
    {
        return $this->belongsTo(IssueReport::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function fromAssignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_assignee_user_id');
    }

    public function toAssignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_assignee_user_id');
    }
}
