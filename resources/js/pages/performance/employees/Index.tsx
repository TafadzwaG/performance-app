import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeProfile, Option, Paginated } from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    employeeProfiles: Paginated<EmployeeProfile>;
    filters: { search: string };
    can: { create: boolean };
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    userOptions: Option[];
    roleOptions: Option[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
];

export default function EmployeesIndex({ employeeProfiles, filters, can, departmentOptions, jobTitleOptions, userOptions, roleOptions }: Props) {
    const searchForm = useForm({ search: filters.search ?? '' });
    const createForm = useForm<{ user_id: string; employee_number: string; department_id: string; job_title_id: string; line_manager_user_id: string; approving_manager_user_id: string; employment_status: string; hire_date: string; is_active: boolean; role_ids: number[] }>({
        user_id: '',
        employee_number: '',
        department_id: '',
        job_title_id: '',
        line_manager_user_id: '',
        approving_manager_user_id: '',
        employment_status: 'active',
        hire_date: '',
        is_active: true,
        role_ids: [],
    });

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        searchForm.get(route('performance.employees.index'), { preserveState: true, replace: true });
    };

    const submitCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createForm.post(route('performance.employees.store'));
    };

    return (
        <PerformancePage title="Employees" description="Link application users to employee profiles, managers, and role assignments." breadcrumbs={breadcrumbs}>
            {can.create ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Employee Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitCreate} className="grid gap-4 md:grid-cols-3">
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={createForm.data.user_id} onChange={(event) => createForm.setData('user_id', event.target.value)}>
                                <option value="">User</option>
                                {userOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Input value={createForm.data.employee_number} onChange={(event) => createForm.setData('employee_number', event.target.value)} placeholder="Employee number" />
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={createForm.data.department_id} onChange={(event) => createForm.setData('department_id', event.target.value)}>
                                <option value="">Department</option>
                                {departmentOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={createForm.data.job_title_id} onChange={(event) => createForm.setData('job_title_id', event.target.value)}>
                                <option value="">Job title</option>
                                {jobTitleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={createForm.data.line_manager_user_id} onChange={(event) => createForm.setData('line_manager_user_id', event.target.value)}>
                                <option value="">Line manager</option>
                                {userOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={createForm.data.approving_manager_user_id} onChange={(event) => createForm.setData('approving_manager_user_id', event.target.value)}>
                                <option value="">Approving manager</option>
                                {userOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={createForm.data.employment_status} onChange={(event) => createForm.setData('employment_status', event.target.value)}>
                                <option value="active">Active</option>
                                <option value="probation">Probation</option>
                                <option value="contract">Contract</option>
                                <option value="exited">Exited</option>
                            </select>
                            <Input type="date" value={createForm.data.hire_date} onChange={(event) => createForm.setData('hire_date', event.target.value)} />
                            <select
                                multiple
                                className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
                                value={createForm.data.role_ids.map(String)}
                                onChange={(event) => createForm.setData('role_ids', Array.from(event.target.selectedOptions).map((option) => Number(option.value)))}
                            >
                                {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="md:col-span-3">
                                <Button type="submit" disabled={createForm.processing}>
                                    Save Employee Profile
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : null}
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submitSearch} className="flex gap-2">
                        <Input value={searchForm.data.search} onChange={(event) => searchForm.setData('search', event.target.value)} placeholder="Search employees" />
                        <Button type="submit" variant="outline">
                            Filter
                        </Button>
                    </form>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3">Employee</th>
                                    <th className="p-3">Department</th>
                                    <th className="p-3">Job Title</th>
                                    <th className="p-3">Line Manager</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeeProfiles.data.map((profile) => (
                                    <tr key={profile.id} className="border-t">
                                        <td className="p-3">
                                            <div className="font-medium">{profile.user?.name}</div>
                                            <div className="text-xs text-muted-foreground">{profile.employee_number}</div>
                                        </td>
                                        <td className="p-3">{profile.department?.name ?? '-'}</td>
                                        <td className="p-3">{profile.job_title?.name ?? '-'}</td>
                                        <td className="p-3">{profile.line_manager?.name ?? '-'}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.employees.show', profile.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.employees.edit', profile.id)}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={employeeProfiles} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
