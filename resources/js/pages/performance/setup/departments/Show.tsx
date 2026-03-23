import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Department Summary</CardTitle>
                        <CardDescription>Core definition and usage counts for this department.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <Info label="Code" value={department.code} />
                        <div className="rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="mt-2">
                                <Badge variant={department.is_active ? 'secondary' : 'outline'}>
                                    {department.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                        <Info label="Employees" value={department.employee_profiles_count ?? 0} />
                        <Info label="Templates" value={department.appraisal_templates_count ?? 0} />
                        <Info label="Goal Library Items" value={department.goal_library_items_count ?? 0} className="md:col-span-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                        <CardDescription>Operational context for planning and reporting.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {department.description ?? 'No description provided.'}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}

function Info({ label, value, className }: { label: string; value: string | number; className?: string }) {
    return (
        <div className={`rounded-lg border p-4 ${className ?? ''}`.trim()}>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-lg font-semibold">{value}</div>
        </div>
    );
}
