<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Organization;
use App\Models\Role;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class CarribeanBayEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $organization = Organization::query()
            ->where('slug', 'carribean_bay')
            ->where('status', 'active')
            ->firstOrFail();
        $previousOrganization = app(TenantContext::class)->organization();
        $previousSupportAccess = app(TenantContext::class)->isSupportAccess();

        app(TenantContext::class)->set($organization);
        app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

        try {
            DB::transaction(function () use ($organization): void {
                $location = Location::query()->where('is_active', true)->orderBy('id')->firstOrFail();
                $departments = $this->seedDepartments();
                $jobTitles = $this->seedJobTitles();
                $approverId = EmployeeProfile::query()->orderBy('id')->value('user_id');
                $users = [];

                foreach ($this->employees() as $key => $employee) {
                    $user = User::withoutGlobalScopes()->firstOrNew(['email' => $employee['email']]);
                    $user->forceFill([
                        'name' => $employee['name'],
                        'password' => 'password',
                        'email_verified_at' => now(),
                        'is_approved' => true,
                        'force_password_change' => false,
                    ])->save();

                    $user->memberships()->updateOrCreate(
                        ['organization_id' => $organization->id],
                        [
                            'status' => 'active',
                            'is_default' => true,
                            'access_all_locations' => $employee['role'] === 'Manager',
                            'invited_at' => now(),
                            'activated_at' => now(),
                            'suspended_at' => null,
                        ],
                    );
                    $user->locations()->syncWithoutDetaching([$location->id]);

                    $role = Role::query()
                        ->where('organization_id', $organization->id)
                        ->where('name', $employee['role'])
                        ->where('guard_name', 'web')
                        ->firstOrFail();
                    $user->syncRoles([$role]);

                    $users[$key] = $user;

                    $profile = EmployeeProfile::withTrashed()->firstOrNew(['user_id' => $user->id]);
                    $profile->fill([
                        'employee_number' => $employee['employee_number'],
                        'department_id' => $departments[$employee['department']]->id,
                        'location_id' => $location->id,
                        'job_title_id' => $jobTitles[$employee['job_title']]->id,
                        'line_manager_user_id' => $key === 'front_office_manager' ? null : ($users['front_office_manager']->id ?? null),
                        'approving_manager_user_id' => $approverId,
                        'employment_status' => 'active',
                        'employment_type' => 'permanent',
                        'work_location' => $location->name,
                        'hire_date' => $employee['hire_date'],
                        'is_review_eligible' => true,
                        'is_active' => true,
                        'notes' => 'Carribean Bay demonstration employee.',
                    ]);

                    if ($profile->trashed()) {
                        $profile->restore();
                    }

                    $profile->save();
                }
            });
        } finally {
            if ($previousOrganization) {
                app(TenantContext::class)->set($previousOrganization, $previousSupportAccess);
                app(PermissionRegistrar::class)->setPermissionsTeamId($previousOrganization->id);
            } else {
                app(TenantContext::class)->clear();
                app(PermissionRegistrar::class)->setPermissionsTeamId(null);
            }
        }
    }

    /**
     * @return array<string, Department>
     */
    private function seedDepartments(): array
    {
        $departments = [];

        foreach ([
            'FRONT-OFFICE' => 'Front Office',
            'FOOD-BEVERAGE' => 'Food & Beverage',
            'HOUSEKEEPING' => 'Housekeeping',
            'FINANCE' => 'Finance',
        ] as $code => $name) {
            $departments[$code] = $this->restoreOrCreate(Department::class, ['code' => $code], [
                'name' => $name,
                'description' => "{$name} department at Carribean Bay.",
                'is_active' => true,
            ]);
        }

        return $departments;
    }

    /**
     * @return array<string, JobTitle>
     */
    private function seedJobTitles(): array
    {
        $jobTitles = [];

        foreach ([
            'FRONT-OFFICE-MANAGER' => 'Front Office Manager',
            'EXECUTIVE-CHEF' => 'Executive Chef',
            'HOUSEKEEPING-SUPERVISOR' => 'Housekeeping Supervisor',
            'FINANCE-OFFICER' => 'Finance Officer',
        ] as $code => $name) {
            $jobTitles[$code] = $this->restoreOrCreate(JobTitle::class, ['code' => $code], [
                'name' => $name,
                'description' => "{$name} role at Carribean Bay.",
                'is_active' => true,
            ]);
        }

        return $jobTitles;
    }

    /**
     * @return array<string, array{
     *     name: string,
     *     email: string,
     *     employee_number: string,
     *     department: string,
     *     job_title: string,
     *     role: string,
     *     hire_date: string
     * }>
     */
    private function employees(): array
    {
        return [
            'front_office_manager' => [
                'name' => 'Rudo Ncube',
                'email' => 'rudo.ncube@carribeanbay.test',
                'employee_number' => 'CB-EMP-0002',
                'department' => 'FRONT-OFFICE',
                'job_title' => 'FRONT-OFFICE-MANAGER',
                'role' => 'Manager',
                'hire_date' => '2023-02-01',
            ],
            'executive_chef' => [
                'name' => 'Tendai Moyo',
                'email' => 'tendai.moyo@carribeanbay.test',
                'employee_number' => 'CB-EMP-0003',
                'department' => 'FOOD-BEVERAGE',
                'job_title' => 'EXECUTIVE-CHEF',
                'role' => 'Employee',
                'hire_date' => '2023-06-12',
            ],
            'housekeeping_supervisor' => [
                'name' => 'Nyasha Dube',
                'email' => 'nyasha.dube@carribeanbay.test',
                'employee_number' => 'CB-EMP-0004',
                'department' => 'HOUSEKEEPING',
                'job_title' => 'HOUSEKEEPING-SUPERVISOR',
                'role' => 'Employee',
                'hire_date' => '2024-01-15',
            ],
            'finance_officer' => [
                'name' => 'Tariro Sibanda',
                'email' => 'tariro.sibanda@carribeanbay.test',
                'employee_number' => 'CB-EMP-0005',
                'department' => 'FINANCE',
                'job_title' => 'FINANCE-OFFICER',
                'role' => 'Employee',
                'hire_date' => '2024-04-08',
            ],
        ];
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function restoreOrCreate(string $modelClass, array $attributes, array $values): Model
    {
        $model = $modelClass::withTrashed()->firstOrNew($attributes);
        $model->fill($values);

        if (method_exists($model, 'trashed') && $model->trashed()) {
            $model->restore();
        }

        $model->save();

        return $model;
    }
}
