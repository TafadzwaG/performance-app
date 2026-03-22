import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { JobTitle } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs = (jobTitle: JobTitle): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Job Titles', href: route('performance.setup.job_titles.index') },
    { title: jobTitle.name, href: route('performance.setup.job_titles.show', jobTitle.id) },
];

export default function JobTitleShow({ jobTitle }: { jobTitle: JobTitle }) {
    return (
        <PerformancePage
            title={jobTitle.name}
            description="Job title detail and usage summary."
            breadcrumbs={breadcrumbs(jobTitle)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.setup.job_titles.edit', jobTitle.id)}>Edit</Link>
                </Button>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Job Title Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <Info label="Code" value={jobTitle.code} />
                    <Info label="Status" value={jobTitle.is_active ? 'Active' : 'Inactive'} />
                    <Info label="Employees" value={jobTitle.employee_profiles_count ?? 0} />
                    <Info label="Templates" value={jobTitle.appraisal_templates_count ?? 0} />
                    <div className="md:col-span-2">
                        <div className="text-sm font-medium">Description</div>
                        <div className="text-sm text-muted-foreground">{jobTitle.description ?? 'No description provided.'}</div>
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
