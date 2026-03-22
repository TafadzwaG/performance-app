import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { GoalLibraryItem } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs = (item: GoalLibraryItem): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Goal Library', href: route('performance.goal_library.index') },
    { title: item.title, href: route('performance.goal_library.show', item.id) },
];

export default function GoalLibraryShow({ goalLibraryItem }: { goalLibraryItem: GoalLibraryItem }) {
    return (
        <PerformancePage
            title={goalLibraryItem.title}
            description="Reusable SMART goal detail."
            breadcrumbs={breadcrumbs(goalLibraryItem)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.goal_library.edit', goalLibraryItem.id)}>Edit</Link>
                </Button>
            }
        >
            <Card>
                <CardContent className="space-y-3 p-6 text-sm">
                    <div>Perspective: {goalLibraryItem.perspective?.name ?? '-'}</div>
                    <div>Department: {goalLibraryItem.department?.name ?? '-'}</div>
                    <div>Job title: {goalLibraryItem.job_title?.name ?? '-'}</div>
                    <div>KPI: {goalLibraryItem.kpi_measure ?? '-'}</div>
                    <div>Target: {goalLibraryItem.target_definition ?? '-'}</div>
                    <div>Evidence source: {goalLibraryItem.evidence_source ?? '-'}</div>
                    <div>Description: {goalLibraryItem.description ?? '-'}</div>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
