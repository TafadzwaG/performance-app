<?php

namespace App\Services\Performance;

use App\Models\EmployeeProfile;
use App\Models\User;
use App\Services\Access\UserDeletionService;
use Illuminate\Validation\ValidationException;

class EmployeeProfileDeletionService
{
    public function __construct(
        private readonly UserDeletionService $userDeletionService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function impact(EmployeeProfile $employeeProfile): array
    {
        $employeeProfile->loadMissing('user');

        if (! $employeeProfile->user) {
            return $this->impactProfileOnly($employeeProfile);
        }

        $impact = $this->userDeletionService->impact($employeeProfile->user);
        $impact['employee'] = [
            'id' => $employeeProfile->id,
            'employee_number' => $employeeProfile->employee_number,
            'name' => $employeeProfile->user->name,
            'email' => $employeeProfile->user->email,
            'user_id' => $employeeProfile->user_id,
        ];

        return $impact;
    }

    public function delete(EmployeeProfile $employeeProfile, User $actor): void
    {
        $employeeProfile->loadMissing('user');

        if ($actor->employeeProfile?->id === $employeeProfile->id) {
            throw ValidationException::withMessages([
                'employee_profile' => ['You cannot delete your own employee profile.'],
            ]);
        }

        if ($employeeProfile->user) {
            $this->userDeletionService->delete($employeeProfile->user, $actor);

            return;
        }

        $employeeProfile->forceDelete();
    }

    /**
     * @return array<string, mixed>
     */
    private function impactProfileOnly(EmployeeProfile $employeeProfile): array
    {
        return [
            'employee' => [
                'id' => $employeeProfile->id,
                'employee_number' => $employeeProfile->employee_number,
                'name' => null,
                'email' => null,
                'user_id' => null,
            ],
            'items' => [
                [
                    'key' => 'employee_profile',
                    'label' => 'Employee profile',
                    'count' => 1,
                    'description' => 'HR record, department, job title, and manager assignments.',
                ],
            ],
            'cleared' => [],
            'totals' => [
                'records' => 1,
            ],
        ];
    }
}
