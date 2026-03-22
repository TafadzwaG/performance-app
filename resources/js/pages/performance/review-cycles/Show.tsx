import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Option, ReviewCycle } from '@/types/performance';
import { router, Link } from '@inertiajs/react';

interface Props {
    reviewCycle: ReviewCycle;
    statusCounts: Record<string, number>;
    templateOptions: Option[];
}

const breadcrumbs = (cycle: ReviewCycle): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Review Cycles', href: route('performance.review_cycles.index') },
    { title: cycle.name, href: route('performance.review_cycles.show', cycle.id) },
];

export default function ReviewCycleShow({ reviewCycle, statusCounts, templateOptions }: Props) {
    void templateOptions;

    return (
        <PerformancePage
            title={reviewCycle.name}
            description="Cycle details, status counts, and assignment actions."
            breadcrumbs={breadcrumbs(reviewCycle)}
            secondaryActions={
                <>
                    <Button asChild variant="outline">
                        <Link href={route('performance.review_cycles.edit', reviewCycle.id)}>Edit</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('performance.review_cycles.assign', reviewCycle.id)}>Assign Employees</Link>
                    </Button>
                    {reviewCycle.status !== 'open' ? (
                        <Button type="button" variant="outline" onClick={() => router.post(route('performance.review_cycles.open', reviewCycle.id))}>
                            Open Cycle
                        </Button>
                    ) : null}
                    {reviewCycle.status !== 'closed' ? (
                        <Button type="button" variant="outline" onClick={() => router.post(route('performance.review_cycles.close', reviewCycle.id))}>
                            Close Cycle
                        </Button>
                    ) : null}
                </>
            }
        >
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardContent className="space-y-2 p-6 text-sm">
                        <div>Code: {reviewCycle.code}</div>
                        <div>Status: {reviewCycle.status}</div>
                        <div>Start: {reviewCycle.start_date}</div>
                        <div>End: {reviewCycle.end_date}</div>
                        <div>Description: {reviewCycle.description ?? '-'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="space-y-2 p-6 text-sm">
                        {Object.entries(statusCounts).map(([status, count]) => (
                            <div key={status}>
                                {status}: {count}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
