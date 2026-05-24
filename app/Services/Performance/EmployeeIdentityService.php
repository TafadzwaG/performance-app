<?php

namespace App\Services\Performance;

use App\Models\EmployeeProfile;
use App\Models\User;
use Illuminate\Support\Str;

class EmployeeIdentityService
{
    public function normalizeEmployeeNumber(string $employeeNumber): string
    {
        return Str::upper(trim($employeeNumber));
    }

    public function findUserByEmployeeNumber(string $employeeNumber): ?User
    {
        $employeeNumber = $this->normalizeEmployeeNumber($employeeNumber);

        if ($employeeNumber === '') {
            return null;
        }

        $profile = EmployeeProfile::query()
            ->with('user')
            ->whereRaw('upper(trim(employee_number)) = ?', [$employeeNumber])
            ->first();

        return $profile?->user;
    }

    public function profileForEmployeeNumber(string $employeeNumber): ?EmployeeProfile
    {
        $employeeNumber = $this->normalizeEmployeeNumber($employeeNumber);

        if ($employeeNumber === '') {
            return null;
        }

        return EmployeeProfile::query()
            ->whereRaw('upper(trim(employee_number)) = ?', [$employeeNumber])
            ->first();
    }

    public function employeeNumberExists(string $employeeNumber, ?int $ignoreProfileId = null): bool
    {
        $employeeNumber = $this->normalizeEmployeeNumber($employeeNumber);

        if ($employeeNumber === '') {
            return false;
        }

        return EmployeeProfile::query()
            ->when($ignoreProfileId, fn ($query) => $query->whereKeyNot($ignoreProfileId))
            ->whereRaw('upper(trim(employee_number)) = ?', [$employeeNumber])
            ->exists();
    }

    /**
     * @return array<string, int>
     */
    public function userIdsByEmployeeNumber(): array
    {
        return EmployeeProfile::query()
            ->pluck('user_id', 'employee_number')
            ->mapWithKeys(fn ($userId, $employeeNumber) => [
                $this->normalizeEmployeeNumber((string) $employeeNumber) => (int) $userId,
            ])
            ->all();
    }

    /**
     * @param  array<string, int>  $employeeNumberUserMap
     */
    public function resolveUserIdByEmployeeNumber(
        string $raw,
        array $employeeNumberUserMap,
        int $line,
        string $label,
        array &$errors,
    ): int|null|false {
        $employeeNumber = $this->normalizeEmployeeNumber($raw);

        if ($employeeNumber === '') {
            return null;
        }

        $userId = $employeeNumberUserMap[$employeeNumber] ?? null;

        if (! $userId) {
            $errors[] = "Row {$line} has unknown {$label}: {$raw}.";

            return false;
        }

        return $userId;
    }
}
