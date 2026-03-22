import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Competency } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs = (competency: Competency): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Competencies', href: route('performance.setup.competencies.index') },
    { title: competency.name, href: route('performance.setup.competencies.show', competency.id) },
];

export default function CompetencyShow({ competency }: { competency: Competency }) {
    return (
        <PerformancePage
            title={competency.name}
            description="Competency detail and metadata."
            breadcrumbs={breadcrumbs(competency)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.setup.competencies.edit', competency.id)}>Edit</Link>
                </Button>
            }
        >
            <Card>
                <CardContent className="space-y-3 p-6 text-sm">
                    <div>Code: {competency.code}</div>
                    <div>Category: {competency.category}</div>
                    <div>Department: {competency.department?.name ?? '-'}</div>
                    <div>Job title: {competency.job_title?.name ?? '-'}</div>
                    <div>Description: {competency.description ?? 'No description provided.'}</div>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
