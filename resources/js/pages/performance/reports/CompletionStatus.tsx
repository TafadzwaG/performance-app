import CycleFilters from '@/components/performance/CycleFilters';
import PerformancePage from '@/components/performance/PerformancePage';
import ReportTable from '@/components/performance/ReportTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import { CheckCircle2, Clock3, Layers3, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
    { title: 'Completion Status', href: route('performance.reports.completion_status') },
];

function getNumericValue(row: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        const value = row[key];

        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const parsed = Number(value.replace(/,/g, '').trim());
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }

    return 0;
}

export default function CompletionStatus({
    rows,
    reviewCycleOptions,
    filters,
}: {
    rows: Array<Record<string, unknown>>;
    reviewCycleOptions: Option[];
    filters: { review_cycle_id?: number | null };
}) {
    const selectedCycleLabel =
        reviewCycleOptions.find((option) => String(option.value) === String(filters.review_cycle_id ?? ''))?.label ??
        'All cycles';

    const totalEmployees = rows.reduce(
        (sum, row) =>
            sum +
            getNumericValue(row, [
                'total_employees',
                'employees',
                'employee_count',
                'total_staff',
                'staff_count',
                'total',
            ]),
        0,
    );

    const completedCount = rows.reduce(
        (sum, row) => sum + getNumericValue(row, ['completed', 'completed_count', 'done']),
        0,
    );

    const overdueCount = rows.reduce(
        (sum, row) => sum + getNumericValue(row, ['overdue', 'overdue_count', 'late']),
        0,
    );

    const completionRate = totalEmployees > 0 ? Math.round((completedCount / totalEmployees) * 100) : 0;

    return (
        <PerformancePage
            title="Completion Status"
            description="Workflow status counts for the selected cycle."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-4">
                    <Card className="xl:col-span-2 shadow-sm">
                        <CardHeader className="pb-4">
                            <Badge variant="secondary" className="w-fit">
                                Report view
                            </Badge>
                            <div className="space-y-2">
                                <CardTitle className="text-3xl tracking-tight">Completion Status</CardTitle>
                                <CardDescription className="max-w-2xl text-sm leading-6">
                                    Review workflow status counts for the selected cycle, with a structured summary of
                                    department progress, completions, and overdue activity.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <div className="rounded-lg border bg-muted/30 px-3 py-2">
                                Active cycle: <span className="font-medium text-foreground">{selectedCycleLabel}</span>
                            </div>
                            <div className="rounded-lg border bg-muted/30 px-3 py-2">
                                Departments: <span className="font-medium text-foreground">{rows.length}</span>
                            </div>
                            <div className="rounded-lg border bg-muted/30 px-3 py-2">
                                Available filters:{' '}
                                <span className="font-medium text-foreground">{reviewCycleOptions.length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{completionRate}%</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Based on completed reviews against the total employee count in the visible rows.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{totalEmployees.toLocaleString()}</div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Completed</span>
                                <span className="font-medium text-foreground">{completedCount.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Overdue</span>
                                <span className="font-medium text-foreground">{overdueCount.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <CycleFilters
                    reviewCycleOptions={reviewCycleOptions}
                    reviewCycleId={filters.review_cycle_id ?? null}
                    reportRoute="performance.reports.completion_status"
                    exportKey="completion-status"
                    reportTitle="Completion Status"
                />

                <ReportTable rows={rows} />
            </div>
        </PerformancePage>
    );
}