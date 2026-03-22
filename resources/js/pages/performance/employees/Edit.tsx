import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeProfile, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    employeeProfile: EmployeeProfile;
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    userOptions: Option[];
    roleOptions: Option[];
    selectedRoleIds: number[];
}

export default function EmployeeEdit({ employeeProfile, departmentOptions, jobTitleOptions, userOptions, roleOptions, selectedRoleIds }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Employees', href: route('performance.employees.index') },
        { title: employeeProfile.user?.name ?? employeeProfile.employee_number, href: route('performance.employees.show', employeeProfile.id) },
        { title: 'Edit', href: route('performance.employees.edit', employeeProfile.id) },
    ];

    const { data, setData, put, processing } = useForm({
        user_id: String(employeeProfile.user_id),
        employee_number: employeeProfile.employee_number,
        department_id: employeeProfile.department_id ? String(employeeProfile.department_id) : '',
        job_title_id: employeeProfile.job_title_id ? String(employeeProfile.job_title_id) : '',
        line_manager_user_id: employeeProfile.line_manager_user_id ? String(employeeProfile.line_manager_user_id) : '',
        approving_manager_user_id: employeeProfile.approving_manager_user_id ? String(employeeProfile.approving_manager_user_id) : '',
        employment_status: employeeProfile.employment_status,
        hire_date: employeeProfile.hire_date ?? '',
        is_active: employeeProfile.is_active,
        role_ids: selectedRoleIds,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.employees.update', employeeProfile.id));
    };

    return (
        <PerformancePage title="Edit Employee Profile" description="Update employee profile assignments and role mapping." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
                        <input className="rounded-md border bg-muted px-3 py-2 text-sm" value={employeeProfile.user?.name ?? ''} readOnly />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.employee_number} onChange={(event) => setData('employee_number', event.target.value)} />
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.department_id} onChange={(event) => setData('department_id', event.target.value)}>
                            <option value="">Department</option>
                            {departmentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.job_title_id} onChange={(event) => setData('job_title_id', event.target.value)}>
                            <option value="">Job title</option>
                            {jobTitleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.line_manager_user_id} onChange={(event) => setData('line_manager_user_id', event.target.value)}>
                            <option value="">Line manager</option>
                            {userOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.approving_manager_user_id} onChange={(event) => setData('approving_manager_user_id', event.target.value)}>
                            <option value="">Approving manager</option>
                            {userOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.employment_status} onChange={(event) => setData('employment_status', event.target.value)}>
                            <option value="active">Active</option>
                            <option value="probation">Probation</option>
                            <option value="contract">Contract</option>
                            <option value="exited">Exited</option>
                        </select>
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="date" value={data.hire_date} onChange={(event) => setData('hire_date', event.target.value)} />
                        <select
                            multiple
                            className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
                            value={data.role_ids.map(String)}
                            onChange={(event) => setData('role_ids', Array.from(event.target.selectedOptions).map((option) => Number(option.value)))}
                        >
                            {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={data.is_active} onChange={(event) => setData('is_active', event.target.checked)} />
                            Active
                        </label>
                        <div className="md:col-span-3">
                            <Button type="submit" disabled={processing}>
                                Update Employee Profile
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
