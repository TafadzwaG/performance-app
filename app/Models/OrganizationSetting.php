<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;

class OrganizationSetting extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id', 'legal_name', 'registration_number', 'tax_number', 'address_line_1',
        'address_line_2', 'city', 'state_province', 'postal_code', 'country', 'report_footer',
        'calibration_enabled', 'mail_from_name', 'mail_reply_to_address', 'logo_path',
    ];

    protected function casts(): array
    {
        return [
            'calibration_enabled' => 'boolean',
        ];
    }
}
