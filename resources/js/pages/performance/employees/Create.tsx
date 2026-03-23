import EmployeeProfileForm from '@/components/performance/employees/EmployeeProfileForm';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeProfileFormData, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Briefcase, Save, ShieldCheck, UserPlus } from 'lucide-react';

interface Props {
    formDefaults: EmployeeProfileFormData;
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    userOptions: Option[];
    roleOptions: Option[];
    employmentStatusOptions: Option[];
    genderOptions: Option[];
    maritalStatusOptions: Option[];
    employmentTypeOptions: Option[];
    can: { assignRoles: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
    { title: 'Create', href: route('performance.employees.create') },
];

export default function EmployeeCreate({
    formDefaults,
    departmentOptions,
    jobTitleOptions,
    userOptions,
    roleOptions,
    employmentStatusOptions,
    genderOptions,
    maritalStatusOptions,
    employmentTypeOptions,
    can,
}: Props) {
    const form = useForm<EmployeeProfileFormData>(formDefaults);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(route('performance.employees.store'));
    };

    return (
        <PerformancePage
            title="Create Employee Profile"
            description="Add a full employee profile with identity, contact, employment, and performance setup information."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Employee onboarding
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Create Employee Profile
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Initialize a new employee record with identity, contact, employment, and
                                    performance-readiness details.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Card className="shadow-none">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/30">
                                        <UserPlus className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Users</p>
                                        <p className="text-sm font-semibold text-foreground">{userOptions.length}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-none">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/30">
                                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Departments</p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {departmentOptions.length}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-none">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/30">
                                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Roles</p>
                                        <p className="text-sm font-semibold text-foreground">{roleOptions.length}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <EmployeeProfileForm
                    form={form}
                    mode="create"
                    departmentOptions={departmentOptions}
                    jobTitleOptions={jobTitleOptions}
                    userOptions={userOptions}
                    roleOptions={roleOptions}
                    employmentStatusOptions={employmentStatusOptions}
                    genderOptions={genderOptions}
                    maritalStatusOptions={maritalStatusOptions}
                    employmentTypeOptions={employmentTypeOptions}
                    canAssignRoles={can.assignRoles}
                />

                <div className="flex items-center justify-end border-t pt-6">
                    <Button type="submit" disabled={form.processing}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Employee Profile
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}