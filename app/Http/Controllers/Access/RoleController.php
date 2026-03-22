<?php

namespace App\Http\Controllers\Access;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\StoreRoleRequest;
use App\Http\Requests\Performance\UpdateRoleRequest;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct()
    {
        $this->authorizeResource(Role::class, 'role');
    }

    public function index(): Response
    {
        $roles = Role::query()
            ->with(['permissions', 'users'])
            ->orderBy('name')
            ->paginate(10);

        return Inertia::render('access/roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('access/roles/Create', [
            'permissionGroups' => $this->permissionGroups(),
            'userOptions' => $this->userOptions(),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $role = Role::query()->create([
            'name' => $request->validated('name'),
            'guard_name' => 'web',
        ]);

        $role->syncPermissions($request->validated('permission_ids', []));
        $role->users()->sync($request->validated('user_ids', []));

        return to_route('access.roles.show', $role);
    }

    public function show(Role $role): Response
    {
        $role->load(['permissions', 'users']);

        return Inertia::render('access/roles/Show', [
            'role' => $role,
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function edit(Role $role): Response
    {
        $role->load(['permissions', 'users']);

        return Inertia::render('access/roles/Edit', [
            'role' => $role,
            'permissionGroups' => $this->permissionGroups(),
            'userOptions' => $this->userOptions(),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $role->update([
            'name' => $request->validated('name'),
        ]);

        $role->syncPermissions($request->validated('permission_ids', []));
        $role->users()->sync($request->validated('user_ids', []));

        return to_route('access.roles.show', $role);
    }
}
