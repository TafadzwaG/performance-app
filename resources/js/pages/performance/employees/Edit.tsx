import EmployeeProfileEditSummary from '@/components/performance/employees/EmployeeProfileEditSummary';
import EmployeeProfileForm from '@/components/performance/employees/EmployeeProfileForm';
import ProfilePasswordChangeSection from '@/components/performance/employees/ProfilePasswordChangeSection';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeFieldConfigItem, EmployeeProfile, EmployeeProfileFormData, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Briefcase, PencilLine, Save, ShieldCheck } from 'lucide-react';

interface Props {
    employeeProfile: EmployeeProfile;
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

interface EditProps extends Props {
    isOwnProfile?: boolean;
}

export default function EmployeeEdit({
    employeeProfile,
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
    isOwnProfile = false,
}: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = isOwnProfile
        ? [
              { title: 'Dashboard', href: '/dashboard' },
              { title: 'Profile', href: route('performance.profile.show') },
              { title: 'Edit', href: route('performance.profile.edit') },
          ]
        : [
              { title: 'Performance', href: '/performance/dashboard' },
              { title: 'Employees', href: route('performance.employees.index') },
              {
                  title: employeeProfile.user?.name ?? employeeProfile.employee_number,
                  href: route('performance.employees.show', employeeProfile.id),
              },
              { title: 'Edit', href: route('performance.employees.edit', employeeProfile.id) },
          ];

    const form = useForm<EmployeeProfileFormData>(formDefaults);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.put(
            isOwnProfile
                ? route('performance.profile.update')
                : route('performance.employees.update', employeeProfile.id),
        );
    };

    return (
        <PerformancePage
            title={isOwnProfile ? 'Edit My Profile' : 'Edit Employee Profile'}
            description={
                isOwnProfile
                    ? 'Update your personal and contact details.'
                    : 'Update identity, reporting, employment, and performance-readiness details.'
            }
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                {isOwnProfile ? 'My profile' : 'Employee administration'}
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    {isOwnProfile ? 'Edit My Profile' : 'Edit Employee Profile'}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    {isOwnProfile
                                        ? 'Update your personal and contact information. Employment details are managed by HR.'
                                        : 'Update employee identity, contact, reporting line, and performance setup details.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Card className="shadow-none">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/30">
                                        <PencilLine className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Employee</p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {employeeProfile.employee_number}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-none">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/30">
                                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Department</p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {employeeProfile.department?.name ?? '-'}
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
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {employeeProfile.is_active ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {isOwnProfile ? (
                    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                        <div className="space-y-6 lg:col-span-8">
                            <EmployeeProfileForm
                                form={form}
                                mode="edit"
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

                            <ProfilePasswordChangeSection />

                            <div className="flex items-center justify-end border-t pt-6">
                                <Button type="submit" disabled={form.processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Profile
                                </Button>
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <EmployeeProfileEditSummary employeeProfile={employeeProfile} formData={form.data} />
                        </div>
                    </div>
                ) : (
                    <>
                        <EmployeeProfileForm
                            form={form}
                            mode="edit"
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

                        <div className="flex items-center justify-end border-t pt-6">
                            <Button type="submit" disabled={form.processing}>
                                <Save className="mr-2 h-4 w-4" />
                                Update Employee Profile
                            </Button>
                        </div>
                    </>
                )}
            </form>
        </PerformancePage>
    );
}
