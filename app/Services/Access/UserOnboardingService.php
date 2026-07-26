<?php

namespace App\Services\Access;

use App\Models\Role;
use App\Models\User;
use App\Notifications\Access\UserOnboardingNotification;
use App\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserOnboardingService
{
    public function generatePassword(int $length = 16): string
    {
        return Str::password($length);
    }

    public function createUser(array $payload, ?User $actor = null): array
    {
        return $this->createUsers([$payload], $actor)[0];
    }

    public function createUsers(array $rows, ?User $actor = null, array $defaults = []): array
    {
        $results = [];

        DB::transaction(function () use ($rows, $defaults, &$results) {
            foreach ($rows as $row) {
                $results[] = $this->provisionUser($row, $defaults);
            }
        });

        foreach ($results as $index => $result) {
            if (! $result['send_credentials_email']) {
                continue;
            }

            $delivered = rescue(function () use ($result, $actor) {
                $result['user']->notify(new UserOnboardingNotification(
                    plainPassword: $result['plain_password'],
                    forcePasswordChange: $result['user']->force_password_change,
                    createdByName: $actor?->name,
                    organizationId: app(TenantContext::class)->id(),
                ));

                $result['user']->forceFill([
                    'welcome_notification_sent_at' => now(),
                ])->save();

                return true;
            }, false, report: false);

            $results[$index]['credentials_emailed'] = (bool) $delivered;
        }

        return $results;
    }

    private function provisionUser(array $row, array $defaults = []): array
    {
        $roleIds = array_values(array_unique(array_filter($row['role_ids'] ?? $defaults['role_ids'] ?? [])));
        $permissionIds = array_values(array_unique(array_filter($row['permission_ids'] ?? $defaults['permission_ids'] ?? [])));
        $plainPassword = filled($row['password'] ?? null)
            ? (string) $row['password']
            : $this->generatePassword();
        $forcePasswordChange = (bool) ($row['force_password_change'] ?? $defaults['force_password_change'] ?? true);
        $sendCredentialsEmail = (bool) ($row['send_credentials_email'] ?? $defaults['send_credentials_email'] ?? true);

        $organizationId = app(TenantContext::class)->requireId();
        $user = User::withoutGlobalScopes()->where('email', Str::lower((string) $row['email']))->first();

        if ($user?->memberships()->where('organization_id', $organizationId)->exists()) {
            throw ValidationException::withMessages(['email' => 'This user already belongs to the current organization.']);
        }

        $user ??= User::withoutGlobalScopes()->create([
            'name' => (string) $row['name'],
            'email' => Str::lower((string) $row['email']),
            'email_verified_at' => now(),
            'password' => $plainPassword,
            'force_password_change' => $forcePasswordChange,
            'password_changed_at' => $forcePasswordChange ? null : now(),
            'is_approved' => true,
        ]);

        $user->memberships()->create([
            'organization_id' => $organizationId,
            'status' => 'active',
            'is_default' => ! $user->memberships()->where('status', 'active')->exists(),
            'access_all_locations' => (bool) ($row['access_all_locations'] ?? false),
            'invited_at' => now(),
            'activated_at' => now(),
        ]);
        $user->locations()->sync($row['location_ids'] ?? []);

        if ($roleIds !== []) {
            $roles = Role::query()->whereIn('id', $roleIds)->get();
            $user->syncRoles($roles);
        }

        if ($permissionIds !== []) {
            $user->syncPermissions($permissionIds);
        }

        $user->load(['roles:id,name', 'permissions:id,name', 'employeeProfile:id,user_id,employee_number']);

        return [
            'user' => $user,
            'plain_password' => $plainPassword,
            'send_credentials_email' => $sendCredentialsEmail,
            'credentials_emailed' => false,
        ];
    }
}
