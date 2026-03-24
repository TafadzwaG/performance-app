<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\CompleteEmployeeProfileRequest;
use App\Models\EmployeeProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeProfileCompletionController extends Controller
{
    use BuildsPerformanceViewData;

    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->user()->employeeProfile()->exists()) {
            return to_route('dashboard');
        }

        return Inertia::render('performance/employees/CompleteProfile', [
            'formDefaults' => $this->formDefaults($request->user()),
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'userOptions' => $this->userOptions(),
            'roleOptions' => [],
            'employmentStatusOptions' => $this->employmentStatusOptions(),
            'genderOptions' => $this->genderOptions(),
            'maritalStatusOptions' => $this->maritalStatusOptions(),
            'employmentTypeOptions' => $this->employmentTypeOptions(),
            'can' => [
                'assignRoles' => false,
            ],
        ]);
    }

    public function store(CompleteEmployeeProfileRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->employeeProfile()->exists()) {
            return to_route('dashboard');
        }

        EmployeeProfile::create($request->validated() + [
            'user_id' => $user->id,
            'is_active' => (bool) $request->boolean('is_active', true),
            'is_review_eligible' => (bool) $request->boolean('is_review_eligible', true),
        ]);

        return to_route('dashboard')->with('success', 'Employee profile completed successfully.');
    }

    private function formDefaults(User $user): array
    {
        return [
            'user_id' => (string) $user->id,
            'employee_number' => sprintf('EMP-%05d', $user->id),
            'national_id' => '',
            'date_of_birth' => '',
            'gender' => '',
            'marital_status' => '',
            'personal_phone' => '',
            'home_address_line_1' => '',
            'home_address_line_2' => '',
            'city' => '',
            'state_province' => '',
            'postal_code' => '',
            'country' => '',
            'emergency_contact_name' => '',
            'emergency_contact_phone' => '',
            'department_id' => '',
            'job_title_id' => '',
            'line_manager_user_id' => '',
            'approving_manager_user_id' => '',
            'employment_status' => 'active',
            'employment_type' => '',
            'work_location' => '',
            'hire_date' => '',
            'probation_end_date' => '',
            'confirmation_date' => '',
            'is_review_eligible' => true,
            'review_eligibility_date' => '',
            'notes' => '',
            'is_active' => true,
            'role_ids' => [],
        ];
    }
}
