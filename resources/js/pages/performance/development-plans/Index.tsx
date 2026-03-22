import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Paginated } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Development Plans', href: route('performance.development_plans.index') },
];

export default function DevelopmentPlansIndex({ plans }: { plans: Paginated<Appraisal> }) {
    return (
        <PerformancePage title="Development Plans" description="Track strengths, improvement areas, and follow-up actions." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3">Employee</th>
                                    <th className="p-3">Cycle</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.data.map((plan) => (
                                    <tr key={plan.id} className="border-t">
                                        <td className="p-3">{plan.employee_name_snapshot}</td>
                                        <td className="p-3">{plan.cycle_name_snapshot}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.development_plans.show', plan.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.development_plans.edit', plan.id)}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={plans} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
