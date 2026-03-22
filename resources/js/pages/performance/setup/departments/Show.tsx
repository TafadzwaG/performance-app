import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Department } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs = (department: Department): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Departments', href: route('performance.setup.departments.index') },
    { title: department.name, href: route('performance.setup.departments.show', department.id) },
];

export default function DepartmentShow({ department }: { department: Department }) {
    return (
        <PerformancePage
            title={department.name}
            description="Department detail and usage summary."
            breadcrumbs={breadcrumbs(department)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.setup.departments.edit', department.id)}>Edit</Link>
                </Button>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Department Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <Info label="Code" value={department.code} />
                    <Info label="Status" value={department.is_active ? 'Active' : 'Inactive'} />
                    <Info label="Employees" value={department.employee_profiles_count ?? 0} />
                    <Info label="Templates" value={department.appraisal_templates_count ?? 0} />
                    <div className="md:col-span-2">
                        <div className="text-sm font-medium">Description</div>
                        <div className="text-sm text-muted-foreground">{department.description ?? 'No description provided.'}</div>
                    </div>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-lg font-semibold">{value}</div>
        </div>
    );
}
