<?php

namespace App\Support\Access;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class UserExportColumnRegistry
{
    public static function columns(): Collection
    {
        return collect([
            ['key' => 'name', 'label' => 'Name', 'section' => 'account', 'default' => true, 'required' => true],
            ['key' => 'email', 'label' => 'Email', 'section' => 'account', 'default' => true, 'required' => false],
            ['key' => 'approval_status', 'label' => 'Approval Status', 'section' => 'account', 'default' => true, 'required' => false],
            ['key' => 'created_at', 'label' => 'Created At', 'section' => 'account', 'default' => true, 'required' => false],
            ['key' => 'updated_at', 'label' => 'Updated At', 'section' => 'account', 'default' => false, 'required' => false],
            ['key' => 'email_verified_at', 'label' => 'Email Verified At', 'section' => 'security', 'default' => false, 'required' => false],
            ['key' => 'mfa_enabled', 'label' => 'MFA Enabled', 'section' => 'security', 'default' => false, 'required' => false],
            ['key' => 'force_password_change', 'label' => 'Force Password Change', 'section' => 'security', 'default' => false, 'required' => false],
            ['key' => 'password_changed_at', 'label' => 'Password Changed At', 'section' => 'security', 'default' => false, 'required' => false],
            ['key' => 'roles', 'label' => 'Roles', 'section' => 'access', 'default' => true, 'required' => false],
            ['key' => 'permissions', 'label' => 'Direct Permissions', 'section' => 'access', 'default' => true, 'required' => false],
            ['key' => 'direct_permission_count', 'label' => 'Direct Permission Count', 'section' => 'access', 'default' => false, 'required' => false],
            ['key' => 'employee_number', 'label' => 'Employee Number', 'section' => 'employee', 'default' => true, 'required' => false],
            ['key' => 'department', 'label' => 'Department', 'section' => 'employee', 'default' => true, 'required' => false],
            ['key' => 'job_title', 'label' => 'Job Title', 'section' => 'employee', 'default' => true, 'required' => false],
            ['key' => 'employment_status', 'label' => 'Employment Status', 'section' => 'employee', 'default' => false, 'required' => false],
            ['key' => 'employee_profile_url', 'label' => 'Employee Profile Link', 'section' => 'employee', 'default' => false, 'required' => false],
        ]);
    }

    public static function defaultKeys(): array
    {
        return self::columns()
            ->filter(fn (array $column) => $column['default'])
            ->pluck('key')
            ->all();
    }

    public static function allowedKeys(): array
    {
        return self::columns()->pluck('key')->all();
    }

    public static function labelsFor(array $keys): array
    {
        $columns = self::columns()->keyBy('key');

        return collect($keys)
            ->map(fn (string $key) => $columns[$key]['label'] ?? $key)
            ->all();
    }

    public static function value(User $user, string $key): mixed
    {
        $profile = $user->employeeProfile;

        return match ($key) {
            'name' => $user->name,
            'email' => $user->email,
            'approval_status' => $user->is_approved ? 'Active' : 'Pending',
            'created_at' => $user->created_at?->format('d M Y H:i'),
            'updated_at' => $user->updated_at?->format('d M Y H:i'),
            'email_verified_at' => $user->email_verified_at?->format('d M Y H:i'),
            'mfa_enabled' => $user->email_mfa_enabled ? 'Yes' : 'No',
            'force_password_change' => $user->force_password_change ? 'Yes' : 'No',
            'password_changed_at' => $user->password_changed_at?->format('d M Y H:i'),
            'roles' => $user->roles->pluck('name')->join(', '),
            'permissions' => $user->permissions->pluck('name')->join(', '),
            'direct_permission_count' => (string) $user->permissions->count(),
            'employee_number' => $profile?->employee_number,
            'department' => $profile?->department?->name,
            'job_title' => $profile?->jobTitle?->name,
            'employment_status' => self::label($profile?->employment_status?->value ?? $profile?->employment_status),
            'employee_profile_url' => $profile
                ? route('performance.employees.show', $profile->id, absolute: true)
                : null,
            default => null,
        };
    }

    private static function label(?string $value): ?string
    {
        return $value ? Str::of($value)->replace(['_', '-'], ' ')->title()->toString() : null;
    }
}
