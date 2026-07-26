<?php

namespace App\Observers;

use App\Models\EmployeeProfile;
use App\Services\Performance\OpenAppraisalManagerAssignmentService;

class EmployeeProfileObserver
{
    public function __construct(
        private readonly OpenAppraisalManagerAssignmentService $assignmentService,
    ) {}

    public function updated(EmployeeProfile $employeeProfile): void
    {
        $this->assignmentService->sync(
            $employeeProfile,
            $employeeProfile->wasChanged('line_manager_user_id'),
            $employeeProfile->wasChanged('approving_manager_user_id'),
        );
    }
}
