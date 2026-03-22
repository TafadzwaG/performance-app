import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, ReviewCycle } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Review Cycles', href: route('performance.review_cycles.index') },
];

export default function ReviewCyclesIndex({ reviewCycles }: { reviewCycles: Paginated<ReviewCycle> }) {
    return (
        <PerformancePage title="Review Cycles" description="Create, open, close, and monitor appraisal cycles." breadcrumbs={breadcrumbs} primaryAction={{ label: 'New Cycle', href: route('performance.review_cycles.create') }}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3">Cycle</th>
                                    <th className="p-3">Dates</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviewCycles.data.map((cycle) => (
                                    <tr key={cycle.id} className="border-t">
                                        <td className="p-3">{cycle.name}</td>
                                        <td className="p-3">
                                            {cycle.start_date} - {cycle.end_date}
                                        </td>
                                        <td className="p-3">{cycle.status}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.review_cycles.show', cycle.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.review_cycles.edit', cycle.id)}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={reviewCycles} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
