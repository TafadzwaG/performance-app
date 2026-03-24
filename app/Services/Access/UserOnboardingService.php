<?php

namespace App\Services\Access;

use App\Models\Role;
use App\Models\User;
use App\Notifications\Access\UserOnboardingNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        $user = User::query()->create([
            'name' => (string) $row['name'],
            'email' => (string) $row['email'],
            'email_verified_at' => now(),
            'password' => $plainPassword,
            'force_password_change' => $forcePasswordChange,
            'password_changed_at' => $forcePasswordChange ? null : now(),
        ]);

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
