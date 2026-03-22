import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeProfile } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs = (profile: EmployeeProfile): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
    { title: profile.user?.name ?? profile.employee_number, href: route('performance.employees.show', profile.id) },
];

export default function EmployeeShow({ employeeProfile }: { employeeProfile: EmployeeProfile }) {
    return (
        <PerformancePage
            title={employeeProfile.user?.name ?? employeeProfile.employee_number}
            description="Employee profile, reporting lines, roles, and appraisal history."
            breadcrumbs={breadcrumbs(employeeProfile)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.employees.edit', employeeProfile.id)}>Edit</Link>
                </Button>
            }
        >
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>Employee number: {employeeProfile.employee_number}</div>
                        <div>Email: {employeeProfile.user?.email}</div>
                        <div>Department: {employeeProfile.department?.name ?? '-'}</div>
                        <div>Job title: {employeeProfile.job_title?.name ?? '-'}</div>
                        <div>Status: {employeeProfile.employment_status}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Reporting Line</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>Line manager: {employeeProfile.line_manager?.name ?? 'Not assigned'}</div>
                        <div>Approving manager: {employeeProfile.approving_manager?.name ?? 'Not assigned'}</div>
                        <div>Roles: {employeeProfile.user?.roles?.map((role) => role.name).join(', ') || 'None assigned'}</div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Appraisal History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(employeeProfile.appraisals ?? []).map((appraisal) => (
                        <div key={appraisal.id} className="rounded-lg border p-3 text-sm">
                            <div className="font-medium">{appraisal.cycle_name_snapshot}</div>
                            <div className="text-muted-foreground">{appraisal.status}</div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
