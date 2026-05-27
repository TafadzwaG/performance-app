<?php

namespace App\Http\Controllers\Performance;

use App\Exports\Performance\EmployeeImportTemplateExport;
use App\Exports\Performance\EmployeeProfilesExport;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\ConfirmEmployeeImportRequest;
use App\Http\Requests\Performance\DeleteEmployeeProfileRequest;
use App\Http\Requests\Performance\PreviewEmployeeImportRequest;
use App\Http\Requests\Performance\StoreEmployeeProfileRequest;
use App\Http\Requests\Performance\UpdateEmployeeLineManagerRequest;
use App\Http\Requests\Performance\UpdateEmployeeProfileRequest;
use App\Models\EmployeeProfile;
use App\Models\Role;
use App\Services\Performance\EmployeeFieldConfigService;
use App\Services\Performance\EmployeeImportService;
use App\Services\Performance\EmployeePerformanceAnalyticsService;
use App\Services\Performance\EmployeeProfileDeletionService;
use App\Services\Performance\Pdf\EmployeePerformanceTrendPdfService;
use App\Support\Performance\EmployeeExportColumnRegistry;
use App\Support\Performance\EmployeeFieldRegistry;
use App\Support\Security\SensitiveValueMasker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EmployeeProfileController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly EmployeeFieldConfigService $fieldConfigService,
        private readonly EmployeePerformanceAnalyticsService $employeePerformanceAnalyticsService,
        private readonly EmployeePerformanceTrendPdfService $employeePerformanceTrendPdfService,
    ) {
        $this->authorizeResource(EmployeeProfile::class, 'employee_profile');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');
        $visibleIndexFields = $this->fieldConfigService->enabledFieldKeys(EmployeeFieldRegistry::SCREEN_EMPLOYEE_INDEX);

        $employeeProfiles = $this->employeeIndexQuery($search, $visibleIndexFields)
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/employees/Index', [
            'employeeProfiles' => $employeeProfiles,
            'filters' => ['search' => $search],
            'fieldConfig' => $this->fieldConfigService->forScreen(EmployeeFieldRegistry::SCREEN_EMPLOYEE_INDEX)->all(),
            'exportColumns' => EmployeeExportColumnRegistry::columns()->all(),
            'can' => [
                'create' => $request->user()->can('performance.employees.create'),
                'import' => $request->user()->can('create', EmployeeProfile::class),
                'export' => $request->user()->can('performance.employees.view'),
                'delete' => $request->user()->can('performance.employees.update'),
            ],
        ]);
    }

    public function uploadCreate(Request $request): Response
    {
        $this->authorize('create', EmployeeProfile::class);

        return Inertia::render('performance/employees/Upload');
    }

    public function uploadPreview(PreviewEmployeeImportRequest $request, EmployeeImportService $employeeImportService): Response
    {
        $this->authorize('create', EmployeeProfile::class);

        $file = $request->file('file');
        $preview = $employeeImportService->preview($file);

        $request->session()->put(EmployeeImportService::SESSION_KEY, [
            'path' => $employeeImportService->storeUploadForSession($file),
            'original_name' => $file->getClientOriginalName(),
            'preview' => $preview,
        ]);

        return Inertia::render('performance/employees/UploadPreview', [
            'preview' => $preview,
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
        ]);
    }

    public function uploadStore(ConfirmEmployeeImportRequest $request, EmployeeImportService $employeeImportService): RedirectResponse
    {
        $this->authorize('create', EmployeeProfile::class);

        $session = $request->session()->get(EmployeeImportService::SESSION_KEY);

        if (! is_array($session) || ! isset($session['path'])) {
            return to_route('performance.employees.upload')
                ->withErrors(['file' => 'Upload session expired. Please upload your file again.']);
        }

        $this->assertMappingsComplete($session['preview'] ?? [], $request->validated());

        $departmentMappings = collect($request->validated('department_mappings'))
            ->mapWithKeys(fn (array $item) => [$item['source'] => (string) $item['department_id']])
            ->all();
        $jobTitleMappings = collect($request->validated('job_title_mappings'))
            ->mapWithKeys(fn (array $item) => [$item['source'] => (string) $item['job_title_id']])
            ->all();

        $file = $employeeImportService->uploadedFileFromSession($session);
        $rows = $employeeImportService->parse($file, $departmentMappings, $jobTitleMappings);
        $count = $employeeImportService->import($rows);

        $employeeImportService->clearSessionUpload($session);
        $request->session()->forget(EmployeeImportService::SESSION_KEY);

        return to_route('performance.employees.index')
            ->with('success', "{$count} employee profiles imported successfully.");
    }

    /**
     * @param  array<string, mixed>  $preview
     * @param  array<string, mixed>  $validated
     */
    private function assertMappingsComplete(array $preview, array $validated): void
    {
        $departmentSources = collect($preview['departments'] ?? [])->pluck('source')->all();
        $jobTitleSources = collect($preview['job_titles'] ?? [])->pluck('source')->all();

        $mappedDepartments = collect($validated['department_mappings'] ?? [])->pluck('source')->all();
        $mappedJobTitles = collect($validated['job_title_mappings'] ?? [])->pluck('source')->all();

        $missingDepartments = array_diff($departmentSources, $mappedDepartments);
        $missingJobTitles = array_diff($jobTitleSources, $mappedJobTitles);

        if ($missingDepartments !== [] || $missingJobTitles !== []) {
            throw ValidationException::withMessages([
                'department_mappings' => 'Complete all department and job title mappings before importing.',
            ]);
        }
    }

    public function downloadUploadTemplate(EmployeeImportTemplateExport $export): BinaryFileResponse
    {
        $this->authorize('create', EmployeeProfile::class);

        return $export->download('employee-upload-template-'.now()->format('Ymd-Hi').'.xlsx');
    }

    public function export(Request $request): BinaryFileResponse
    {
        $this->authorize('viewAny', EmployeeProfile::class);

        $validated = $request->validate([
            'search' => ['nullable', 'string'],
            'columns' => ['nullable', 'array'],
            'columns.*' => ['string', Rule::in(EmployeeExportColumnRegistry::allowedKeys())],
        ]);

        $requestedColumns = $validated['columns'] ?? EmployeeExportColumnRegistry::defaultKeys();
        $columns = collect($requestedColumns)
            ->prepend('user_name')
            ->unique()
            ->values()
            ->all();

        $visibleIndexFields = $this->fieldConfigService->enabledFieldKeys(EmployeeFieldRegistry::SCREEN_EMPLOYEE_INDEX);
        $employees = $this->employeeIndexQuery((string) ($validated['search'] ?? ''), $visibleIndexFields)
            ->latest()
            ->get();

        return (new EmployeeProfilesExport($employees, $columns))
            ->download('employees-'.now()->format('Ymd-Hi').'.xlsx');
    }

    public function create(Request $request): Response
    {
        return Inertia::render('performance/employees/Create', [
            ...$this->employeeFormPageData($request),
            'formDefaults' => $this->employeeFormDefaults(),
            'fieldConfig' => $this->fieldConfigService->forScreen(EmployeeFieldRegistry::SCREEN_EMPLOYEE_CREATE)->all(),
        ]);
    }

    public function store(StoreEmployeeProfileRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $profile = EmployeeProfile::create(Arr::except($validated, ['role_ids']) + [
            'employment_status' => $validated['employment_status'] ?? 'active',
            'is_active' => array_key_exists('is_active', $validated) ? (bool) $validated['is_active'] : true,
            'is_review_eligible' => array_key_exists('is_review_eligible', $validated) ? (bool) $validated['is_review_eligible'] : true,
        ]);

        if (($request->user()->can('performance.employees.assign_roles') || $request->user()->can('access.roles.assign_users')) && $profile->user) {
            $roles = Role::query()->whereIn('id', $validated['role_ids'] ?? [])->get();
            $profile->user->syncRoles($roles);
        }

        return to_route('performance.employees.show', $profile);
    }

    public function show(Request $request, EmployeeProfile $employeeProfile): Response
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

        $employeeProfile->setAttribute(
            'national_id',
            SensitiveValueMasker::maskNationalId($employeeProfile->national_id),
        );

        return Inertia::render('performance/employees/Show', [
            'employeeProfile' => $employeeProfile,
            'managerOptions' => $this->managerUserOptions(),
            'fieldConfig' => $this->fieldConfigService->forScreen(EmployeeFieldRegistry::SCREEN_EMPLOYEE_SHOW)->all(),
            'performanceTrend' => $this->employeePerformanceAnalyticsService->employeeTrend($employeeProfile->id),
            'peerComparison' => $this->employeePerformanceAnalyticsService->peerComparison($employeeProfile->id),
            'can' => [
                'assignManagers' => $request->user()->can('performance.employees.assign_managers')
                    || $request->user()->can('performance.employees.update'),
                'edit' => $request->user()->can('update', $employeeProfile),
            ],
        ]);
    }

    public function exportPerformanceTrendPdf(Request $request, EmployeeProfile $employeeProfile): BinaryFileResponse
    {
        $this->authorize('view', $employeeProfile);

        return $this->employeePerformanceTrendPdfService->download($employeeProfile, $request->user());
    }

    public function edit(EmployeeProfile $employeeProfile): Response
    {
        $employeeProfile->load(['user.roles', 'department', 'jobTitle', 'lineManager', 'approvingManager']);

        return Inertia::render('performance/employees/Edit', [
            ...$this->employeeFormPageData(request()),
            'employeeProfile' => $employeeProfile,
            'formDefaults' => $this->employeeFormDefaults($employeeProfile),
            'fieldConfig' => $this->fieldConfigService->forScreen(EmployeeFieldRegistry::SCREEN_EMPLOYEE_EDIT)->all(),
        ]);
    }

    public function update(UpdateEmployeeProfileRequest $request, EmployeeProfile $employeeProfile): RedirectResponse
    {
        $validated = $request->validated();

        $attributes = Arr::except($validated, ['role_ids']);

        if (array_key_exists('is_active', $validated)) {
            $attributes['is_active'] = (bool) $validated['is_active'];
        }

        if (array_key_exists('is_review_eligible', $validated)) {
            $attributes['is_review_eligible'] = (bool) $validated['is_review_eligible'];
        }

        $employeeProfile->update($attributes);

        if (($request->user()->can('performance.employees.assign_roles') || $request->user()->can('access.roles.assign_users')) && $employeeProfile->user) {
            $roles = Role::query()->whereIn('id', $validated['role_ids'] ?? [])->get();
            $employeeProfile->user->syncRoles($roles);
        }

        return to_route('performance.employees.show', $employeeProfile);
    }

    public function updateLineManager(UpdateEmployeeLineManagerRequest $request, EmployeeProfile $employeeProfile): RedirectResponse
    {
        $this->authorize('update', $employeeProfile);
        abort_unless(
            $request->user()->can('performance.employees.assign_managers')
            || $request->user()->can('performance.employees.update'),
            403,
        );

        $employeeProfile->update([
            'line_manager_user_id' => $request->validated('line_manager_user_id'),
        ]);

        return to_route('performance.employees.show', $employeeProfile)
            ->with('success', 'Line manager updated successfully.');
    }

    public function deletionImpact(EmployeeProfile $employeeProfile, EmployeeProfileDeletionService $deletionService): JsonResponse
    {
        $this->authorize('delete', $employeeProfile);

        return response()->json($deletionService->impact($employeeProfile));
    }

    public function destroy(
        DeleteEmployeeProfileRequest $request,
        EmployeeProfile $employeeProfile,
        EmployeeProfileDeletionService $deletionService,
    ): RedirectResponse {
        $label = $employeeProfile->user?->name ?? $employeeProfile->employee_number;

        $deletionService->delete($employeeProfile, $request->user());

        return to_route('performance.employees.index')
            ->with('success', "{$label} and all associated records were deleted permanently.");
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

    private function employeeIndexQuery(string $search, array $visibleIndexFields)
    {
        return EmployeeProfile::query()
            ->with([
                'user.roles',
                'department',
                'jobTitle',
                'lineManager',
                'approvingManager',
                'latestAppraisal.reviewCycle',
                'latestAppraisal.overallRatingLevel',
                'latestAppraisal.calibratedOverallRatingLevel',
            ])
            ->when($search, function ($query) use ($search, $visibleIndexFields) {
                $query->where(function ($builder) use ($search, $visibleIndexFields) {
                    if (in_array('employee_number', $visibleIndexFields, true)) {
                        $builder->orWhere('employee_number', 'like', "%{$search}%");
                    }

                    if (in_array('national_id', $visibleIndexFields, true)) {
                        $builder->orWhere('national_id', 'like', "%{$search}%");
                    }

                    if (in_array('user_name', $visibleIndexFields, true) || in_array('user_email', $visibleIndexFields, true)) {
                        $builder->orWhereHas('user', function ($userQuery) use ($search, $visibleIndexFields) {
                            if (in_array('user_name', $visibleIndexFields, true)) {
                                $userQuery->where('name', 'like', "%{$search}%");
                            }

                            if (in_array('user_email', $visibleIndexFields, true)) {
                                $userQuery->orWhere('email', 'like', "%{$search}%");
                            }
                        });
                    }
                });
            });
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
