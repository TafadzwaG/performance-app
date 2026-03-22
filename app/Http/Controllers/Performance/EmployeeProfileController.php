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
                $query->where('employee_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
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
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'userOptions' => $this->userOptions(),
            'roleOptions' => $this->roleOptions(),
        ]);
    }

    public function store(StoreEmployeeProfileRequest $request): RedirectResponse
    {
        $profile = EmployeeProfile::create($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        if (($request->user()->can('performance.employees.assign_roles') || $request->user()->can('access.roles.assign_users')) && $profile->user) {
            $roles = Role::query()->whereIn('id', $request->validated('role_ids', []))->get();
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
            'employeeProfile' => $employeeProfile,
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
            'userOptions' => $this->userOptions(),
            'roleOptions' => $this->roleOptions(),
            'selectedRoleIds' => $employeeProfile->user?->roles->pluck('id')->all() ?? [],
        ]);
    }

    public function update(UpdateEmployeeProfileRequest $request, EmployeeProfile $employeeProfile): RedirectResponse
    {
        $employeeProfile->update($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active'),
        ]);

        if (($request->user()->can('performance.employees.assign_roles') || $request->user()->can('access.roles.assign_users')) && $employeeProfile->user) {
            $roles = Role::query()->whereIn('id', $request->validated('role_ids', []))->get();
            $employeeProfile->user->syncRoles($roles);
        }

        return to_route('performance.employees.show', $employeeProfile);
    }
}
