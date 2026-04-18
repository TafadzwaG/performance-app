<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeFieldSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'screen_key',
        'field_key',
        'is_enabled',
        'is_required',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'is_required' => 'boolean',
            'display_order' => 'integer',
        ];
    }
}
