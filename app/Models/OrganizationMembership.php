<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationMembership extends Model
{
    protected $fillable = [
        'organization_id', 'user_id', 'status', 'is_default', 'access_all_locations',
        'invited_at', 'activated_at', 'suspended_at',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'access_all_locations' => 'boolean',
            'invited_at' => 'datetime',
            'activated_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
