<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\UpdateMyEmployeeProfileRequest;
use App\Models\EmployeeProfile;
use App\Services\Performance\EmployeeFieldConfigService;
use App\Services\Performance\EmployeePerformanceAnalyticsService;
use App\Support\Performance\EmployeeFieldRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class MyEmployeeProfileController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly EmployeeFieldConfigService $fieldConfigService,
        private readonly EmployeePerformanceAnalyticsService $employeePerformanceAnalyticsService,
    ) {}

    public function show(Request $request): Response
    {
        $employeeProfile = $this->profileOrFail($request);

        $this->authorize('view', $employeeProfile);

        $employeeProfile->load([
            'user.roles.permissions',
            'department',
            'jobTitle',
            'lineManager',
            'approvingManager',
            'appraisals.reviewCycle',
            'appraisals.overallRatingLevel',
        ]);

        return Inertia::render('performance/employees/Show', [
            'employeeProfile' => $employeeProfile,
            'managerOptions' => [],
            'fieldConfig' => $this->fieldConfigService->forScreen(EmployeeFieldRegistry::SCREEN_EMPLOYEE_SHOW)->all(),
            'performanceTrend' => $this->employeePerformanceAnalyticsService->employeeTrend($employeeProfile->id),
            'peerComparison' => $this->employeePerformanceAnalyticsService->peerComparison($employeeProfile->id),
            'isOwnProfile' => true,
            'can' => [
                'assignManagers' => false,
                'edit' => true,
            ],
        ]);
    }

    public function edit(Request $request): Response
    {
        $employeeProfile = $this->profileOrFail($request);

        $this->authorize('update', $employeeProfile);

        $employeeProfile->load(['user.roles', 'department', 'jobTitle', 'lineManager', 'approvingManager']);

        return Inertia::render('performance/employees/Edit', [
            'employeeProfile' => $employeeProfile,
            'formDefaults' => $this->employeeFormDefaults($employeeProfile),
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'userOptions' => $this->userOptions(),
            'managerOptions' => $this->managerUserOptions(),
            'roleOptions' => [],
            'employmentStatusOptions' => $this->employmentStatusOptions(),
            'genderOptions' => $this->genderOptions(),
            'maritalStatusOptions' => $this->maritalStatusOptions(),
            'employmentTypeOptions' => $this->employmentTypeOptions(),
            'fieldConfig' => $this->fieldConfigService->forScreen(EmployeeFieldRegistry::SCREEN_EMPLOYEE_SELF_EDIT)->all(),
            'isOwnProfile' => true,
            'can' => [
                'assignRoles' => false,
            ],
        ]);
    }

    public function update(UpdateMyEmployeeProfileRequest $request): RedirectResponse
    {
        $employeeProfile = $this->profileOrFail($request);

        $this->authorize('update', $employeeProfile);

        $validated = $request->validated();
        $allowedKeys = $this->fieldConfigService->enabledFieldKeys(EmployeeFieldRegistry::SCREEN_EMPLOYEE_SELF_EDIT);

        $employeeProfile->update(Arr::only($validated, $allowedKeys));

        return to_route('performance.profile.show')
            ->with('success', 'Your profile was updated successfully.');
    }

    private function profileOrFail(Request $request): EmployeeProfile
    {
        $profile = $request->user()?->employeeProfile;

        abort_unless($profile, 404);

        return $profile;
    }

    private function employeeFormDefaults(EmployeeProfile $employeeProfile): array
    {
        return [
            'user_id' => (string) $employeeProfile->user_id,
            'employee_number' => $employeeProfile->employee_number,
            'national_id' => $employeeProfile->national_id ?? '',
            'date_of_birth' => $employeeProfile->date_of_birth?->format('Y-m-d') ?? '',
            'gender' => $employeeProfile->gender ?? '',
            'marital_status' => $employeeProfile->marital_status ?? '',
            'personal_phone' => $employeeProfile->personal_phone ?? '',
            'home_address_line_1' => $employeeProfile->home_address_line_1 ?? '',
            'home_address_line_2' => $employeeProfile->home_address_line_2 ?? '',
            'city' => $employeeProfile->city ?? '',
            'state_province' => $employeeProfile->state_province ?? '',
            'postal_code' => $employeeProfile->postal_code ?? '',
            'country' => $employeeProfile->country ?? '',
            'emergency_contact_name' => $employeeProfile->emergency_contact_name ?? '',
            'emergency_contact_phone' => $employeeProfile->emergency_contact_phone ?? '',
            'department_id' => $employeeProfile->department_id ? (string) $employeeProfile->department_id : '',
            'job_title_id' => $employeeProfile->job_title_id ? (string) $employeeProfile->job_title_id : '',
            'line_manager_user_id' => $employeeProfile->line_manager_user_id ? (string) $employeeProfile->line_manager_user_id : '',
            'approving_manager_user_id' => $employeeProfile->approving_manager_user_id ? (string) $employeeProfile->approving_manager_user_id : '',
            'employment_status' => $employeeProfile->employment_status?->value ?? 'active',
            'employment_type' => $employeeProfile->employment_type ?? '',
            'work_location' => $employeeProfile->work_location ?? '',
            'hire_date' => $employeeProfile->hire_date?->format('Y-m-d') ?? '',
            'probation_end_date' => $employeeProfile->probation_end_date?->format('Y-m-d') ?? '',
            'confirmation_date' => $employeeProfile->confirmation_date?->format('Y-m-d') ?? '',
            'is_review_eligible' => $employeeProfile->is_review_eligible ?? true,
            'review_eligibility_date' => $employeeProfile->review_eligibility_date?->format('Y-m-d') ?? '',
            'notes' => $employeeProfile->notes ?? '',
            'is_active' => $employeeProfile->is_active ?? true,
            'role_ids' => $employeeProfile->user?->roles->pluck('id')->all() ?? [],
        ];
    }
}
