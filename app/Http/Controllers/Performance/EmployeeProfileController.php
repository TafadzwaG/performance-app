<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\StoreEmployeeProfileRequest;
use App\Http\Requests\Performance\UpdateEmployeeProfileRequest;
use App\Models\EmployeeProfile;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeProfileController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct()
    {
        $this->authorizeResource(EmployeeProfile::class, 'employee_profile');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $employeeProfiles = EmployeeProfile::query()
            ->with(['user.roles', 'department', 'jobTitle', 'lineManager', 'approvingManager'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('employee_number', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($userQuery) => $userQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/employees/Index', [
            'employeeProfiles' => $employeeProfiles,
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('performance.employees.create'),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('performance/employees/Create', [
            ...$this->employeeFormPageData($request),
            'formDefaults' => $this->employeeFormDefaults(),
        ]);
    }

    public function store(StoreEmployeeProfileRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $profile = EmployeeProfile::create(Arr::except($validated, ['role_ids']) + [
            'is_active' => (bool) $request->boolean('is_active', true),
            'is_review_eligible' => (bool) $request->boolean('is_review_eligible', true),
        ]);

        if (($request->user()->can('performance.employees.assign_roles') || $request->user()->can('access.roles.assign_users')) && $profile->user) {
            $roles = Role::query()->whereIn('id', $validated['role_ids'] ?? [])->get();
            $profile->user->syncRoles($roles);
        }

        return to_route('performance.employees.show', $profile);
    }

    public function show(EmployeeProfile $employeeProfile): Response
    {
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
        ]);
    }

    public function edit(EmployeeProfile $employeeProfile): Response
    {
        $employeeProfile->load(['user.roles', 'department', 'jobTitle', 'lineManager', 'approvingManager']);

        return Inertia::render('performance/employees/Edit', [
            ...$this->employeeFormPageData(request()),
            'employeeProfile' => $employeeProfile,
            'formDefaults' => $this->employeeFormDefaults($employeeProfile),
        ]);
    }

    public function update(UpdateEmployeeProfileRequest $request, EmployeeProfile $employeeProfile): RedirectResponse
    {
        $validated = $request->validated();

        $employeeProfile->update(Arr::except($validated, ['role_ids']) + [
            'is_active' => (bool) $request->boolean('is_active'),
            'is_review_eligible' => (bool) $request->boolean('is_review_eligible', true),
        ]);

        if (($request->user()->can('performance.employees.assign_roles') || $request->user()->can('access.roles.assign_users')) && $employeeProfile->user) {
            $roles = Role::query()->whereIn('id', $validated['role_ids'] ?? [])->get();
            $employeeProfile->user->syncRoles($roles);
        }

        return to_route('performance.employees.show', $employeeProfile);
    }

    private function employeeFormPageData(Request $request): array
    {
        return [
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'userOptions' => $this->userOptions(),
            'managerOptions' => $this->managerUserOptions(),
            'roleOptions' => $this->roleOptions(),
            'employmentStatusOptions' => $this->employmentStatusOptions(),
            'genderOptions' => $this->genderOptions(),
            'maritalStatusOptions' => $this->maritalStatusOptions(),
            'employmentTypeOptions' => $this->employmentTypeOptions(),
            'can' => [
                'assignRoles' => $request->user()->can('performance.employees.assign_roles')
                    || $request->user()->can('access.roles.assign_users'),
            ],
        ];
    }

    private function employeeFormDefaults(?EmployeeProfile $employeeProfile = null): array
    {
        return [
            'user_id' => $employeeProfile ? (string) $employeeProfile->user_id : '',
            'employee_number' => $employeeProfile?->employee_number ?? '',
            'national_id' => $employeeProfile?->national_id ?? '',
            'date_of_birth' => $employeeProfile?->date_of_birth?->format('Y-m-d') ?? '',
            'gender' => $employeeProfile?->gender ?? '',
            'marital_status' => $employeeProfile?->marital_status ?? '',
            'personal_phone' => $employeeProfile?->personal_phone ?? '',
            'home_address_line_1' => $employeeProfile?->home_address_line_1 ?? '',
            'home_address_line_2' => $employeeProfile?->home_address_line_2 ?? '',
            'city' => $employeeProfile?->city ?? '',
            'state_province' => $employeeProfile?->state_province ?? '',
            'postal_code' => $employeeProfile?->postal_code ?? '',
            'country' => $employeeProfile?->country ?? '',
            'emergency_contact_name' => $employeeProfile?->emergency_contact_name ?? '',
            'emergency_contact_phone' => $employeeProfile?->emergency_contact_phone ?? '',
            'department_id' => $employeeProfile?->department_id ? (string) $employeeProfile->department_id : '',
            'job_title_id' => $employeeProfile?->job_title_id ? (string) $employeeProfile->job_title_id : '',
            'line_manager_user_id' => $employeeProfile?->line_manager_user_id ? (string) $employeeProfile->line_manager_user_id : '',
            'approving_manager_user_id' => $employeeProfile?->approving_manager_user_id ? (string) $employeeProfile->approving_manager_user_id : '',
            'employment_status' => $employeeProfile?->employment_status?->value ?? 'active',
            'employment_type' => $employeeProfile?->employment_type ?? '',
            'work_location' => $employeeProfile?->work_location ?? '',
            'hire_date' => $employeeProfile?->hire_date?->format('Y-m-d') ?? '',
            'probation_end_date' => $employeeProfile?->probation_end_date?->format('Y-m-d') ?? '',
            'confirmation_date' => $employeeProfile?->confirmation_date?->format('Y-m-d') ?? '',
            'is_review_eligible' => $employeeProfile?->is_review_eligible ?? true,
            'review_eligibility_date' => $employeeProfile?->review_eligibility_date?->format('Y-m-d') ?? '',
            'notes' => $employeeProfile?->notes ?? '',
            'is_active' => $employeeProfile?->is_active ?? true,
            'role_ids' => $employeeProfile?->user?->roles->pluck('id')->all() ?? [],
        ];
    }
}
