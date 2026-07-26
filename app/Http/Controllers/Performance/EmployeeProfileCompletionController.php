<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\CompleteEmployeeProfileRequest;
use App\Models\EmployeeProfile;
use App\Models\Location;
use App\Models\User;
use App\Services\Performance\EmployeeFieldConfigService;
use App\Support\Performance\EmployeeFieldRegistry;
use App\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeProfileCompletionController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly EmployeeFieldConfigService $fieldConfigService,
    ) {}

    public function create(Request $request): Response|RedirectResponse
    {
        if ($this->activeEmployeeProfile($request->user())) {
            return to_route('dashboard');
        }

        return Inertia::render('performance/employees/CompleteProfile', [
            'formDefaults' => $this->formDefaults($request->user()),
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'userOptions' => $this->userOptions(),
            'managerOptions' => $this->managerUserOptions(),
            'roleOptions' => [],
            'employmentStatusOptions' => $this->employmentStatusOptions(),
            'genderOptions' => $this->genderOptions(),
            'maritalStatusOptions' => $this->maritalStatusOptions(),
            'employmentTypeOptions' => $this->employmentTypeOptions(),
            'fieldConfig' => $this->fieldConfigService->forScreen(EmployeeFieldRegistry::SCREEN_COMPLETE_PROFILE)->all(),
            'can' => [
                'assignRoles' => false,
                ...$this->setupQuickCreateFlags($request->user()),
            ],
        ]);
    }

    public function store(CompleteEmployeeProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $existing = $this->findCompletionProfile($user);

        if ($existing && ! $existing->trashed()) {
            return to_route('dashboard');
        }

        $attributes = $this->profileAttributesFromRequest($request, $user);

        if ($existing?->trashed()) {
            $existing->restore();
            $existing->update($attributes);
        } else {
            EmployeeProfile::query()->create($attributes);
        }

        return to_route('dashboard')->with('success', 'Employee profile completed successfully.');
    }

    private function activeEmployeeProfile(User $user): ?EmployeeProfile
    {
        $profile = $this->findCompletionProfile($user);

        return $profile && ! $profile->trashed() ? $profile : null;
    }

    private function findCompletionProfile(User $user): ?EmployeeProfile
    {
        $organizationId = app(TenantContext::class)->requireId();

        return EmployeeProfile::query()
            ->withoutGlobalScope('location_visibility')
            ->withTrashed()
            ->where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->first();
    }

    /**
     * @return array<string, mixed>
     */
    private function profileAttributesFromRequest(CompleteEmployeeProfileRequest $request, User $user): array
    {
        return $request->validated() + [
            'user_id' => $user->id,
            'location_id' => Location::query()->where('is_active', true)->value('id'),
            'employment_status' => $request->validated('employment_status', 'active'),
            'is_active' => (bool) $request->validated('is_active', true),
            'is_review_eligible' => (bool) $request->validated('is_review_eligible', true),
        ];
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
