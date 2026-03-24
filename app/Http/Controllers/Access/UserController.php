<?php

namespace App\Http\Controllers\Access;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Access\BulkStoreUsersRequest;
use App\Http\Requests\Access\ImportUsersRequest;
use App\Http\Requests\Access\StoreUserRequest;
use App\Http\Requests\Access\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\Access\UserImportService;
use App\Services\Access\UserOnboardingService;
use App\Exports\Access\UserImportTemplateExport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $users = User::query()
            ->with(['roles:id,name', 'permissions:id,name', 'employeeProfile:id,user_id,employee_number'])
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('employeeProfile', fn ($profileQuery) => $profileQuery->where('employee_number', 'like', "%{$search}%"));
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('access/users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('access/users/Create', [
            'roleOptions' => $this->roleOptions(),
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function store(StoreUserRequest $request, UserOnboardingService $userOnboardingService): RedirectResponse
    {
        $result = $userOnboardingService->createUser($request->validated(), $request->user());

        return to_route('access.users.show', $result['user'])
            ->with('success', 'User account created successfully.')
            ->with('generated_credentials', $result['send_credentials_email'] ? [] : [[
                'name' => $result['user']->name,
                'email' => $result['user']->email,
                'password' => $result['plain_password'],
            ]]);
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

        $roles = Role::query()->whereIn('id', $request->validated('role_ids', []))->get();

        $user->syncRoles($roles);
        $user->syncPermissions($request->validated('permission_ids', []));

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
        $results = $userOnboardingService->createUsers(
            $request->validated('users'),
            $request->user(),
            [
                'role_ids' => $request->validated('default_role_ids', []),
                'permission_ids' => $request->validated('default_permission_ids', []),
            ],
        );

        $generatedCredentials = collect($results)
            ->filter(fn (array $result) => ! $result['send_credentials_email'])
            ->map(fn (array $result) => [
                'name' => $result['user']->name,
                'email' => $result['user']->email,
                'password' => $result['plain_password'],
            ])
            ->values()
            ->all();

        return to_route('access.users.index')
            ->with('success', count($results).' users created successfully.')
            ->with('generated_credentials', $generatedCredentials);
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
            \App\Support\Access\UserProvisionRules::bulk(),
        );

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                'file' => $validator->errors()->all(),
            ]);
        }

        $results = $userOnboardingService->createUsers($rows, $request->user());

        $generatedCredentials = collect($results)
            ->filter(fn (array $result) => ! $result['send_credentials_email'])
            ->map(fn (array $result) => [
                'name' => $result['user']->name,
                'email' => $result['user']->email,
                'password' => $result['plain_password'],
            ])
            ->values()
            ->all();

        return to_route('access.users.index')
            ->with('success', count($results).' users imported successfully.')
            ->with('generated_credentials', $generatedCredentials);
    }

    public function downloadImportTemplate(UserImportTemplateExport $export)
    {
        $this->authorize('import', User::class);

        return $export->download('user-import-template-'.now()->format('Ymd-Hi').'.xlsx');
    }
}
