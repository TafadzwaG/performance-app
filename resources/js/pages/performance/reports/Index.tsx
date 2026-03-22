import PerformancePage from '@/components/performance/PerformancePage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import { Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
];

const reportLinks = [
    { title: 'Cycle Summary', routeName: 'performance.reports.cycle_summary' },
    { title: 'Department Summary', routeName: 'performance.reports.department_summary' },
    { title: 'Employee Summary', routeName: 'performance.reports.employee_summary' },
    { title: 'Completion Status', routeName: 'performance.reports.completion_status' },
    { title: 'Rating Distribution', routeName: 'performance.reports.rating_distribution' },
    { title: 'Overdue Reviews', routeName: 'performance.reports.overdue_reviews' },
];

export default function ReportsIndex({ reviewCycleOptions }: { reviewCycleOptions: Option[] }) {
    return (
        <PerformancePage title="Reports" description="Open performance reports and export cycle data." breadcrumbs={breadcrumbs}>
            <div className="grid gap-4 md:grid-cols-3">
                {reportLinks.map((report) => (
                    <Card key={report.title}>
                        <CardHeader>
                            <CardTitle>{report.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <div>{reviewCycleOptions.length} review cycle filters available.</div>
                            <Link href={route(report.routeName)} className="font-medium text-primary">
                                Open report
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PerformancePage>
    );
}
