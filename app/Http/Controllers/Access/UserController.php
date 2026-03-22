<?php

namespace App\Http\Controllers\Access;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Access\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
}
