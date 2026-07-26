<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'company_name',
        'company_legal_name',
        'company_registration_number',
        'company_tax_number',
        'company_email',
        'company_phone',
        'company_website',
        'address_line_1',
        'address_line_2',
        'city',
        'state_province',
        'postal_code',
        'country',
        'report_footer',
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_encryption',
        'mail_from_address',
        'mail_from_name',
        'mail_reply_to_address',
        'mail_reply_to_name',
        'mail_notifications_enabled',
        'email_mfa_required',
        'open_registration_enabled',
        'auto_approve_registrations',
    ];

    protected $casts = [
        'smtp_password' => 'encrypted',
        'smtp_port' => 'integer',
        'mail_notifications_enabled' => 'boolean',
        'email_mfa_required' => 'boolean',
        'open_registration_enabled' => 'boolean',
        'auto_approve_registrations' => 'boolean',
    ];

    public static function current(): self
    {
        return self::query()->firstOrCreate([]);
    }

    public function formattedAddress(): ?string
    {
        $parts = collect([
            $this->address_line_1,
            $this->address_line_2,
            $this->city,
            $this->state_province,
            $this->postal_code,
            $this->country,
        ])
            ->filter(fn (?string $value) => filled($value))
            ->values();

        return $parts->isEmpty() ? null : $parts->join(', ');
    }

    public function exportHeaderRows(): array
    {
        if (! filled($this->company_name)) {
            return [];
        }

        return array_values(array_filter([
            [$this->company_name],
            $this->formattedAddress() ? [$this->formattedAddress()] : null,
            [$this->company_email, $this->company_phone, $this->company_website],
            [''],
        ]));
    }
}
