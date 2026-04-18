import EmployeeProfileForm from '@/components/performance/employees/EmployeeProfileForm';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeFieldConfigItem, EmployeeProfileFormData, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Briefcase, CheckCircle2, Save, ShieldCheck, UserCheck2, UserPlus, Users2 } from 'lucide-react';

interface Props {
    formDefaults: EmployeeProfileFormData;
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    userOptions: Option[];
    managerOptions: Option[];
    roleOptions: Option[];
    employmentStatusOptions: Option[];
    genderOptions: Option[];
    maritalStatusOptions: Option[];
    employmentTypeOptions: Option[];
    fieldConfig: EmployeeFieldConfigItem[];
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
    managerOptions,
    roleOptions,
    employmentStatusOptions,
    genderOptions,
    maritalStatusOptions,
    employmentTypeOptions,
    fieldConfig,
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
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Employee onboarding
                            </Badge>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
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
                                <CardContent className="flex items-center gap-3 p-3.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                                        <UserPlus className="h-4.5 w-4.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Users</p>
                                        <p className="text-sm font-semibold text-foreground">{userOptions.length}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-none">
                                <CardContent className="flex items-center gap-3 p-3.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                                        <Briefcase className="h-4.5 w-4.5 text-muted-foreground" />
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
                                <CardContent className="flex items-center gap-3 p-3.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                                        <ShieldCheck className="h-4.5 w-4.5 text-muted-foreground" />
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

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_320px]">
                    <EmployeeProfileForm
                        form={form}
                        mode="create"
                        departmentOptions={departmentOptions}
                        jobTitleOptions={jobTitleOptions}
                        userOptions={userOptions}
                        managerOptions={managerOptions}
                    roleOptions={roleOptions}
                    employmentStatusOptions={employmentStatusOptions}
                    genderOptions={genderOptions}
                    maritalStatusOptions={maritalStatusOptions}
                    employmentTypeOptions={employmentTypeOptions}
                    fieldConfig={fieldConfig}
                    canAssignRoles={can.assignRoles}
                />

                    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                        <Card className="shadow-sm">
                            <CardContent className="space-y-3 p-4">
                                <div className="flex items-center gap-2">
                                    <Users2 className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-semibold">Create Guidelines</h3>
                                </div>
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Complete all sections for reliable appraisal routing and reporting.
                                </p>
                                <ul className="space-y-2 text-xs text-foreground">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                                        Ensure employee number and national ID are unique.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <UserCheck2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                                        Assign line and approving manager to avoid workflow blocks.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-primary" />
                                        Select all required roles via checkboxes in Performance Setup.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Briefcase className="mt-0.5 h-3.5 w-3.5 text-primary" />
                                        Confirm department/job title for correct reporting breakdown.
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </aside>
                </div>

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
