<?php

namespace App\Services\Performance;

use App\Models\GoalLibraryItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class GoalLibraryScopeService
{
    public function __construct(
        private readonly GoalLibraryLookupService $goalLibraryLookup,
    ) {}

    /**
     * Employees are limited to their profile department and job title.
     * Users with goal-library admin permissions keep the full catalogue.
     */
    public function appliesTo(User $user): bool
    {
        return $user->hasRole('Employee');
    }

    /**
     * @return array{department_id:int,job_title_id:?int}|null
     */
    public function profileScope(User $user): ?array
    {
        $profile = $user->employeeProfile;

        if (! $profile?->department_id) {
            return null;
        }

        return [
            'department_id' => (int) $profile->department_id,
            'job_title_id' => $profile->job_title_id ? (int) $profile->job_title_id : null,
        ];
    }

    public function scopeQuery(Builder $query, User $user): Builder
    {
        return $this->applyEmployeeCatalogScope($query, $user);
    }

    public function applyEmployeeCatalogScope(Builder $query, User $user): Builder
    {
        if (! $this->appliesTo($user)) {
            return $query;
        }

        $scope = $this->profileScope($user);

        if ($scope === null) {
            return $query->whereRaw('0 = 1');
        }

        return $this->goalLibraryLookup->applyProfileScope(
            $query,
            $scope['department_id'],
            $scope['job_title_id'],
            requireJobTitleMatch: true,
        );
    }

    public function itemAccessible(User $user, GoalLibraryItem $goalLibraryItem): bool
    {
        if (! $this->appliesTo($user)) {
            return true;
        }

        $scope = $this->profileScope($user);

        if ($scope === null) {
            return false;
        }

        return $this->goalLibraryLookup->matchesProfile(
            $scope['department_id'],
            $scope['job_title_id'],
            $goalLibraryItem,
            requireJobTitleMatch: true,
        );
    }

    /**
     * @return array{department_id:int,job_title_id:int}
     */
    public function enforcedWriteAttributes(User $user): array
    {
        if (! $this->appliesTo($user)) {
            return [];
        }

        $scope = $this->profileScope($user);

        if ($scope === null || $scope['job_title_id'] === null) {
            throw ValidationException::withMessages([
                'department_id' => 'Complete your employee profile with a department and job title before managing goal library items.',
            ]);
        }

        return [
            'department_id' => $scope['department_id'],
            'job_title_id' => $scope['job_title_id'],
        ];
    }

    /**
     * @return array{
     *     locked: bool,
     *     department_id: ?int,
     *     job_title_id: ?int,
     *     department_label: ?string,
     *     job_title_label: ?string
     * }
     */
    public function frontendContext(User $user): array
    {
        if (! $this->appliesTo($user)) {
            return [
                'locked' => false,
                'department_id' => null,
                'job_title_id' => null,
                'department_label' => null,
                'job_title_label' => null,
            ];
        }

        $user->loadMissing(['employeeProfile.department', 'employeeProfile.jobTitle']);
        $scope = $this->profileScope($user);

        return [
            'locked' => true,
            'department_id' => $scope['department_id'] ?? null,
            'job_title_id' => $scope['job_title_id'] ?? null,
            'department_label' => $user->employeeProfile?->department?->name,
            'job_title_label' => $user->employeeProfile?->jobTitle?->name,
        ];
    }
}
