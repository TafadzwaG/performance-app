<?php

namespace App\Http\Controllers\Access;

use App\Exports\Access\UserImportTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Access\BulkAssignRolesRequest;
use App\Http\Requests\Access\BulkStoreUsersRequest;
use App\Http\Requests\Access\DeleteUserRequest;
use App\Http\Requests\Access\ExportUsersRequest;
use App\Http\Requests\Access\ImportUsersRequest;
use App\Http\Requests\Access\StoreUserRequest;
use App\Http\Requests\Access\UpdateUserRequest;
use App\Mail\UserApprovedNotification;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\Location;
use App\Models\Role;
use App\Models\User;
use App\Services\Access\Export\UserExportService;
use App\Services\Access\UserDeletionService;
use App\Services\Access\UserImportService;
use App\Services\Access\UserOnboardingService;
use App\Services\Performance\EmployeeProfileDeletionService;
use App\Support\Access\AccessAssignmentGuard;
use App\Support\Access\UserExportColumnRegistry;
use App\Support\Access\UserProvisionRules;
use App\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class UserController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
    }

    public function index(Request $request): Response
    {
        $filters = $this->resolveUserIndexFilters($request);

        $organizationId = app(TenantContext::class)->requireId();
        $pendingCount = User::query()->whereHas('memberships', fn ($query) => $query->where('organization_id', $organizationId)->where('status', 'invited'))->count();
        $activeCount = User::query()->whereHas('memberships', fn ($query) => $query->where('organization_id', $organizationId)->where('status', 'active'))->count();

        $usersQuery = $this->usersIndexQuery($filters);

        if ($filters['per_page'] === 'all') {
            $items = $usersQuery->get();
            $users = new LengthAwarePaginator(
                $items,
                $items->count(),
                max($items->count(), 1),
                1,
                ['path' => $request->url(), 'query' => $request->query()],
            );
        } else {
            $users = $usersQuery
                ->paginate((int) $filters['per_page'])
                ->withQueryString();
        }

        return Inertia::render('access/users/Index', [
            'users' => $users,
            'roleOptions' => $this->roleOptions(),
            'departmentOptions' => $this->departmentOptions(),
            'exportColumns' => UserExportColumnRegistry::columns()->all(),
            'filters' => $filters,
            'counts' => [
                'active' => $activeCount,
                'pending' => $pendingCount,
            ],
            'canBulkAssignRoles' => $request->user()->hasRole('Super Admin'),
        ]);
    }

    public function bulkAssignRoles(BulkAssignRolesRequest $request): RedirectResponse
    {
        AccessAssignmentGuard::authorizeRoleAssignment($request->user());

        $validated = $request->validated();
        $roles = Role::query()->whereIn('id', $validated['role_ids'])->get();
        $mode = $validated['mode'];

        if ($validated['apply_to_filter']) {
            $filters = $this->resolveUserIndexFilters($request);
            $users = $this->usersIndexQuery($filters)->get();
        } else {
            $users = User::query()
                ->whereIn('id', $validated['user_ids'])
                ->get();
        }

        $updatedCount = 0;

        foreach ($users as $user) {
            if (! $request->user()->can('update', $user)) {
                continue;
            }

            match ($mode) {
                'add' => $user->assignRole($roles),
                'remove' => $roles->each(fn (Role $role) => $user->removeRole($role)),
                default => $user->syncRoles($roles),
            };

            $updatedCount++;
        }

        $filters = $this->resolveUserIndexFilters($request);

        return to_route('access.users.index', array_filter([
            'search' => $filters['search'] ?: null,
            'sort_by' => $filters['sort_by'],
            'sort_dir' => $filters['sort_dir'],
            'approval_status' => $filters['approval_status'],
            'role_id' => $filters['role_id'],
            'department_id' => $filters['department_id'],
            'employee_link' => $filters['employee_link'],
            'has_direct_permissions' => $filters['has_direct_permissions'],
            'per_page' => $filters['per_page'] !== '10' ? $filters['per_page'] : null,
        ]))->with('success', "Roles updated for {$updatedCount} user".($updatedCount === 1 ? '' : 's').'.');
    }

    public function export(ExportUsersRequest $request, UserExportService $userExportService): BinaryFileResponse
    {
        $validated = $request->validated();
        $filters = $this->resolveUserIndexFilters($request);

        $requestedColumns = $validated['columns'] ?? UserExportColumnRegistry::defaultKeys();
        $columns = collect($requestedColumns)
            ->prepend('name')
            ->unique()
            ->values()
            ->all();

        $users = $this->usersIndexQuery($filters)
            ->with([
                'roles:id,name',
                'permissions:id,name',
                'employeeProfile.department:id,name',
                'employeeProfile.jobTitle:id,name',
            ])
            ->get();

        $format = $validated['format'] ?? 'xlsx';
        $filterSummary = $this->exportFilterSummary($filters);

        return match ($format) {
            'pdf' => $userExportService->pdf($users, $request->user(), $columns, $filterSummary),
            default => $userExportService->excel($users, $request->user(), $columns, $filterSummary),
        };
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('access/users/Create', [
            'roleOptions' => $this->roleOptions(),
            'permissionGroups' => $this->permissionGroups(),
            'locationOptions' => Location::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn (Location $location) => ['value' => $location->id, 'label' => $location->name]),
        ]);
    }

    public function store(StoreUserRequest $request, UserOnboardingService $userOnboardingService): RedirectResponse
    {
        $validated = $request->validated();

        if (! empty($validated['role_ids'] ?? [])) {
            AccessAssignmentGuard::authorizeRoleAssignment($request->user());
        }

        if (! empty($validated['permission_ids'] ?? [])) {
            AccessAssignmentGuard::authorizePermissionAssignment($request->user());
        }

        $result = $userOnboardingService->createUser($validated, $request->user());

        return to_route('access.users.show', $result['user'])
            ->with('success', $result['send_credentials_email']
                ? 'User account created successfully. Login credentials were emailed to the user.'
                : 'User account created successfully. Ask the user to sign in with the generated password shown during onboarding, or send a password reset.');
    }

    public function show(User $user): Response
    {
        $user->load([
            'roles.permissions',
            'permissions',
            'employeeProfile.department',
            'employeeProfile.jobTitle',
        ]);

        return Inertia::render('access/users/Show', [
            'userRecord' => $user,
            'effectivePermissions' => $user->getAllPermissions()
                ->sortBy('name')
                ->values(),
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load([
            'roles',
            'permissions',
            'employeeProfile.department',
            'employeeProfile.jobTitle',
        ]);

        return Inertia::render('access/users/Edit', [
            'userRecord' => $user,
            'roleOptions' => $this->roleOptions(),
            'permissionGroups' => $this->permissionGroups(),
            'selectedRoleIds' => $user->roles->pluck('id')->all(),
            'selectedPermissionIds' => $user->permissions->pluck('id')->all(),
            'locationOptions' => Location::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn (Location $location) => ['value' => $location->id, 'label' => $location->name]),
            'selectedLocationIds' => $user->locations()->pluck('locations.id')->all(),
            'accessAllLocations' => (bool) $user->memberships()->where('organization_id', app(TenantContext::class)->requireId())->value('access_all_locations'),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $attributes = $request->safe()->only(['name', 'email']);

        if ($request->filled('password')) {
            $attributes['password'] = $request->string('password')->toString();
        }

        if (($attributes['email'] ?? $user->email) !== $user->email) {
            $attributes['email_verified_at'] = null;
        }

        $user->update($attributes);

        if ($request->has('role_ids')) {
            AccessAssignmentGuard::authorizeRoleAssignment($request->user());
            $roles = Role::query()->whereIn('id', $request->validated('role_ids', []))->get();
            $user->syncRoles($roles);
        }

        if ($request->has('permission_ids')) {
            AccessAssignmentGuard::authorizePermissionAssignment($request->user());
            $user->syncPermissions($request->validated('permission_ids', []));
        }

        $user->memberships()->where('organization_id', app(TenantContext::class)->requireId())->update([
            'access_all_locations' => $request->boolean('access_all_locations'),
        ]);
        $user->locations()->sync($request->validated('location_ids', []));

        return to_route('access.users.show', $user);
    }

    public function bulkCreate(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('access/users/BulkCreate', [
            'roleOptions' => $this->roleOptions(),
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function bulkStore(BulkStoreUsersRequest $request, UserOnboardingService $userOnboardingService): RedirectResponse
    {
        if (! empty($request->validated('default_role_ids', []))) {
            AccessAssignmentGuard::authorizeRoleAssignment($request->user());
        }

        if (! empty($request->validated('default_permission_ids', []))) {
            AccessAssignmentGuard::authorizePermissionAssignment($request->user());
        }

        $results = $userOnboardingService->createUsers(
            $request->validated('users'),
            $request->user(),
            [
                'role_ids' => $request->validated('default_role_ids', []),
                'permission_ids' => $request->validated('default_permission_ids', []),
            ],
        );

        return to_route('access.users.index')
            ->with('success', count($results).' users created successfully. Credentials were not stored in the session; use password reset or credential email options for each account.');
    }

    public function importCreate(): Response
    {
        $this->authorize('import', User::class);

        return Inertia::render('access/users/Import', [
            'roleOptions' => $this->roleOptions(),
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function importStore(
        ImportUsersRequest $request,
        UserImportService $userImportService,
        UserOnboardingService $userOnboardingService,
    ): RedirectResponse {
        $this->authorize('import', User::class);

        if (! empty($request->validated('default_role_ids', []))) {
            AccessAssignmentGuard::authorizeRoleAssignment($request->user());
        }

        if (! empty($request->validated('default_permission_ids', []))) {
            AccessAssignmentGuard::authorizePermissionAssignment($request->user());
        }

        $rows = $userImportService->parse(
            $request->file('file'),
            [
                'role_ids' => $request->validated('default_role_ids', []),
                'permission_ids' => $request->validated('default_permission_ids', []),
                'force_password_change' => $request->boolean('default_force_password_change'),
                'send_credentials_email' => $request->boolean('default_send_credentials_email'),
            ],
        );

        $validator = Validator::make(
            ['users' => $rows],
            UserProvisionRules::bulk(),
        );

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                'file' => $validator->errors()->all(),
            ]);
        }

        $results = $userOnboardingService->createUsers($rows, $request->user());

        return to_route('access.users.index')
            ->with('success', count($results).' users imported successfully. Credentials were not stored in the session; use password reset or credential email options for each account.');
    }

    public function downloadImportTemplate(UserImportTemplateExport $export)
    {
        $this->authorize('import', User::class);

        return $export->download('user-import-template-'.now()->format('Ymd-Hi').'.xlsx');
    }

    public function deletionImpact(User $user, UserDeletionService $userDeletionService): JsonResponse
    {
        $this->authorize('delete', $user);

        return response()->json($userDeletionService->impact($user));
    }

    public function destroy(DeleteUserRequest $request, User $user, UserDeletionService $userDeletionService, EmployeeProfileDeletionService $profileDeletionService): RedirectResponse
    {
        $organizationId = app(TenantContext::class)->requireId();
        $profile = $user->employeeProfile()->first();

        if ($profile) {
            $profileDeletionService->delete($profile, $request->user());
        }

        $user->syncRoles([]);
        $user->syncPermissions([]);
        $locationIds = Location::query()->pluck('id');
        $user->locations()->detach($locationIds);
        $user->memberships()->where('organization_id', $organizationId)->delete();

        if (! $user->memberships()->exists() && ! $user->is_platform_admin) {
            $user->forceFill(['is_approved' => false])->save();
        }

        return to_route('access.users.index')
            ->with('success', "{$user->name} was removed from this organization. Other memberships were preserved.");
    }

    public function approve(Request $request, User $user): RedirectResponse
    {
        $this->authorize('approve', $user);

        $validated = $request->validate([
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ]);

        AccessAssignmentGuard::authorizeRoleAssignment($request->user());

        $roles = Role::query()
            ->whereIn('id', $validated['role_ids'])
            ->get();

        $user->syncRoles($roles);

        $user->forceFill([
            'is_approved' => true,
        ])->save();
        $user->memberships()->where('organization_id', app(TenantContext::class)->requireId())->update([
            'status' => 'active',
            'activated_at' => now(),
            'suspended_at' => null,
        ]);

        $this->sendApprovalNotification($user, $request->user());

        return to_route('access.users.index', [
            'approval_status' => 'pending',
        ])->with('success', "{$user->name} has been approved and can now sign in.");
    }

    /**
     * @return array{
     *     search: string,
     *     sort_by: string,
     *     sort_dir: string,
     *     approval_status: string,
     *     role_id: ?int,
     *     department_id: ?int,
     *     employee_link: ?string,
     *     has_direct_permissions: ?string,
     *     per_page: string,
     * }
     */
    private function resolveUserIndexFilters(Request $request): array
    {
        $search = (string) $request->string('search');
        $sortBy = (string) $request->string('sort_by', 'name');
        $sortDirection = strtolower((string) $request->string('sort_dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $approvalStatus = (string) $request->string('approval_status', 'active');
        $roleId = $request->filled('role_id') ? (int) $request->input('role_id') : null;
        $departmentId = $request->filled('department_id') ? (int) $request->input('department_id') : null;
        $employeeLink = (string) $request->string('employee_link');
        $hasDirectPermissions = (string) $request->string('has_direct_permissions');

        if (! in_array($approvalStatus, ['active', 'pending'], true)) {
            $approvalStatus = 'active';
        }

        if (! in_array($sortBy, ['name', 'email', 'employee_number', 'created_at', 'updated_at'], true)) {
            $sortBy = 'name';
        }

        if (! in_array($employeeLink, ['linked', 'unlinked'], true)) {
            $employeeLink = '';
        }

        if (! in_array($hasDirectPermissions, ['yes', 'no'], true)) {
            $hasDirectPermissions = '';
        }

        $perPage = (string) $request->string('per_page', '10');
        if (! in_array($perPage, ['10', '25', '50', '100', 'all'], true)) {
            $perPage = '10';
        }

        return [
            'search' => $search,
            'sort_by' => $sortBy,
            'sort_dir' => $sortDirection,
            'approval_status' => $approvalStatus,
            'role_id' => $roleId,
            'department_id' => $departmentId,
            'employee_link' => $employeeLink !== '' ? $employeeLink : null,
            'has_direct_permissions' => $hasDirectPermissions !== '' ? $hasDirectPermissions : null,
            'per_page' => $perPage,
        ];
    }

    /**
     * @param  array{
     *     search: string,
     *     sort_by: string,
     *     sort_dir: string,
     *     approval_status: string,
     *     role_id: ?int,
     *     department_id: ?int,
     *     employee_link: ?string,
     *     has_direct_permissions: ?string,
     *     per_page: string,
     * }  $filters
     */
    private function usersIndexQuery(array $filters): Builder
    {
        $query = User::query()
            ->with(['roles:id,name', 'permissions:id,name', 'employeeProfile:id,user_id,employee_number,department_id'])
            ->whereHas('memberships', fn ($membership) => $membership
                ->where('organization_id', app(TenantContext::class)->requireId())
                ->where('status', $filters['approval_status'] === 'active' ? 'active' : 'invited'))
            ->when($filters['search'], function ($query) use ($filters) {
                $search = $filters['search'];

                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('employeeProfile', fn ($profileQuery) => $profileQuery->where('employee_number', 'like', "%{$search}%"));
                });
            })
            ->when($filters['role_id'], fn ($query) => $query->whereHas(
                'roles',
                fn ($roleQuery) => $roleQuery->where('roles.id', $filters['role_id']),
            ))
            ->when($filters['department_id'], fn ($query) => $query->whereHas(
                'employeeProfile',
                fn ($profileQuery) => $profileQuery->where('department_id', $filters['department_id']),
            ))
            ->when($filters['employee_link'] === 'linked', fn ($query) => $query->whereHas('employeeProfile'))
            ->when($filters['employee_link'] === 'unlinked', fn ($query) => $query->whereDoesntHave('employeeProfile'))
            ->when($filters['has_direct_permissions'] === 'yes', fn ($query) => $query->whereHas('permissions'))
            ->when($filters['has_direct_permissions'] === 'no', fn ($query) => $query->whereDoesntHave('permissions'));

        $locationIds = app(TenantContext::class)->allowedLocationIds(request()->user());
        if ($locationIds !== null) {
            $query->where(function (Builder $builder) use ($locationIds): void {
                $builder->whereKey(request()->user()->id)
                    ->orWhereHas('employeeProfile', fn (Builder $profile) => $profile
                        ->withoutGlobalScope('location_visibility')
                        ->whereIn('location_id', $locationIds));
            });
        }

        $sortBy = $filters['sort_by'];
        $sortDirection = $filters['sort_dir'];

        if ($sortBy === 'employee_number') {
            $query->orderBy(
                EmployeeProfile::query()
                    ->select('employee_number')
                    ->whereColumn('employee_profiles.user_id', 'users.id')
                    ->limit(1),
                $sortDirection,
            )->orderBy('name');
        } else {
            $query->orderBy($sortBy, $sortDirection)->orderBy('id');
        }

        return $query;
    }

    /**
     * @param  array{
     *     search: string,
     *     sort_by: string,
     *     sort_dir: string,
     *     approval_status: string,
     *     role_id: ?int,
     *     department_id: ?int,
     *     employee_link: ?string,
     *     has_direct_permissions: ?string,
     *     per_page: string,
     * }  $filters
     * @return array<string, mixed>
     */
    private function exportFilterSummary(array $filters): array
    {
        $roleName = $filters['role_id']
            ? Role::query()->whereKey($filters['role_id'])->value('name')
            : null;
        $departmentName = $filters['department_id']
            ? Department::query()->whereKey($filters['department_id'])->value('name')
            : null;

        return [
            'search' => $filters['search'],
            'approval_status' => $filters['approval_status'],
            'sort_by' => $filters['sort_by'],
            'sort_dir' => $filters['sort_dir'],
            'role' => $roleName,
            'department' => $departmentName,
            'employee_link' => match ($filters['employee_link']) {
                'linked' => 'Linked to employee profile',
                'unlinked' => 'Not linked to employee profile',
                default => null,
            },
            'has_direct_permissions' => match ($filters['has_direct_permissions']) {
                'yes' => 'Has direct permissions',
                'no' => 'No direct permissions',
                default => null,
            },
        ];
    }

    /**
     * Email the freshly-approved user a styled welcome confirmation.
     * Failures are logged but never block the approval flow.
     */
    private function sendApprovalNotification(User $user, ?User $approvedBy): void
    {
        if (! filled($user->email)) {
            return;
        }

        try {
            $user->loadMissing('roles');

            Mail::to($user->email)->send(new UserApprovedNotification($user, $approvedBy));
        } catch (\Throwable $exception) {
            Log::warning('Failed to send user approval email', [
                'user_id' => $user->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
