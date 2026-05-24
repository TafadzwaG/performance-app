import PerformancePage from '@/components/performance/PerformancePage';
import ReportExportButtons from '@/components/performance/ReportExportButtons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { BreadcrumbItem } from '@/types';
import type { EmployeePerformanceMovementReport } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Building2,
    CheckCircle2,
    CircleAlert,
    Clock3,
    FileSpreadsheet,
    GitCompareArrows,
    RotateCcw,
    ShieldAlert,
    TrendingUp,
    UserRound,
    Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
];

type ReportsPayload = {
    executive_summary: {
        total_appraisals: number;
        finalized_reviews: number;
        completion_rate: number;
        open_reviews: number;
        overdue_reviews: number;
        overdue_rate: number;
        sent_back_count: number;
        sent_back_rate: number;
        average_score: number;
    };
    workflow_pipeline: Array<{ status: string; label: string; total: number; share: number }>;
    department_breakdown: Array<{
        department: string;
        total: number;
        finalized: number;
        completion_rate: number;
        average_score: number;
        overdue_count: number;
        overdue_rate: number;
        sent_back_count: number;
        risk_level: string;
    }>;
    manager_accountability: Array<{
        manager: string;
        assigned_reviews: number;
        pending_manager_reviews: number;
        overdue_reviews: number;
        sent_back_count: number;
        average_turnaround_days: number;
    }>;
    employee_exception_report: Array<{
        employee: string;
        employee_number: string;
        department: string | null;
        cycle: string;
        status: string;
        manager: string;
        flags: string;
        days_overdue: number;
        effective_overall_score: number | null;
    }>;
    rating_quality: {
        average_score: number;
        median_score: number;
        highest_score: number;
        lowest_score: number;
        score_spread: number;
        business_average: number;
        values_average: number;
        business_values_gap: number;
        unrated_finalized_reviews: number;
    };
    overdue_analysis: {
        total_overdue: number;
        average_days_overdue: number;
        oldest_days_overdue: number;
        buckets: Array<{ bucket: string; total: number }>;
    };
    cycle_comparison: {
        current_cycle: string;
        previous_cycle: string | null;
        current_average_score: number;
        previous_average_score: number;
        average_score_delta: number;
        current_completion_rate: number;
        previous_completion_rate: number;
        completion_rate_delta: number;
    };
    employee_performance_movement: EmployeePerformanceMovementReport;
};

type Props = {
    reviewCycleOptions: Option[];
    filters: { review_cycle_id?: number | null };
    reports: ReportsPayload;
};

const workflowConfig = {
    total: { label: 'Reviews', theme: { light: 'var(--chart-1)', dark: 'var(--chart-1)' } },
} satisfies ChartConfig;

const overdueConfig = {
    total: { label: 'Overdue', theme: { light: 'var(--destructive)', dark: 'var(--destructive)' } },
} satisfies ChartConfig;

const managerConfig = {
    pending_manager_reviews: { label: 'Manager pending', theme: { light: 'var(--chart-2)', dark: 'var(--chart-2)' } },
    overdue_reviews: { label: 'Overdue', theme: { light: 'var(--destructive)', dark: 'var(--destructive)' } },
} satisfies ChartConfig;

function formatDelta(value: number, suffix = '') {
    if (value === 0) return `0${suffix}`;
    return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

function labelize(value: string) {
    return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function riskClass(risk: string) {
    if (risk === 'High') return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
    if (risk === 'Medium') return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed bg-muted/10 px-6 text-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}

function ProgressLine({ value, tone = 'bg-primary' }: { value: number; tone?: string }) {
    return (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
        </div>
    );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | null>> }) {
    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
                <thead className="bg-muted/30">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className="border-t">
                            {row.map((value, cellIndex) => (
                                <td key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                    {value ?? ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function trendBadgeClass(status: string) {
    if (status === 'improving') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    if (status === 'declining') return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300';
    if (status === 'stable') return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300';
    return 'border-muted-foreground/30 bg-muted/20 text-muted-foreground';
}

function movementRowCells(row: EmployeePerformanceMovementReport['movement_rows'][number]) {
    return [
        `${row.employee_name} (${row.employee_number})`,
        row.department ?? 'Unassigned',
        row.template_name ?? '—',
        row.previous_cycle_name ?? '—',
        row.current_cycle_name ?? '—',
        row.previous_score ?? '—',
        row.current_score ?? '—',
        row.score_delta ?? '—',
        row.trend_label,
        row.cohort_rank ?? '—',
    ];
}

export default function ReportsIndex({ reviewCycleOptions, filters, reports }: Props) {
    const selectedCycleLabel =
        reviewCycleOptions.find((option) => String(option.value) === String(filters.review_cycle_id ?? ''))?.label ??
        'All cycles';

    const applyFilter = (value: string) => {
        router.get(
            route('performance.reports.index'),
            { review_cycle_id: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <PerformancePage
            title="Comprehensive Reports"
            description="Detailed appraisal reporting across completion, workflow bottlenecks, departments, managers, employees, ratings, and overdue risk."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-8">
                <section className="rounded-xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Comprehensive Performance Reports</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                                This page combines operational reporting, exceptions, accountability, rating quality, and cycle-over-cycle movement for the selected review cycle.
                            </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-[260px_auto] sm:items-end">
                            <div className="space-y-2">
                                <label htmlFor="report-cycle" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    Review Cycle
                                </label>
                                <select
                                    id="report-cycle"
                                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={filters.review_cycle_id ?? ''}
                                    onChange={(event) => applyFilter(event.target.value)}
                                >
                                    <option value="">All cycles</option>
                                    {reviewCycleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button asChild variant="outline">
                                <Link href={route('performance.reports.cycle_summary', { review_cycle_id: filters.review_cycle_id ?? undefined })}>
                                    Export Views
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2 text-sm">
                        <Badge variant="secondary">{selectedCycleLabel}</Badge>
                        <Badge variant="outline">{reports.executive_summary.total_appraisals} appraisal records</Badge>
                        <Badge variant="outline">{reports.employee_exception_report.length} employee exceptions</Badge>
                    </div>
                </section>

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
                    {[
                        ['Total Reviews', reports.executive_summary.total_appraisals, 'All appraisal records in scope', FileSpreadsheet],
                        ['Completion Rate', `${reports.executive_summary.completion_rate}%`, `${reports.executive_summary.finalized_reviews} finalized`, CheckCircle2],
                        ['Overdue Rate', `${reports.executive_summary.overdue_rate}%`, `${reports.executive_summary.overdue_reviews} overdue`, CircleAlert],
                        ['Effective Average', reports.executive_summary.average_score, 'Finalized reviews only', TrendingUp],
                        ['Sent Back', reports.executive_summary.sent_back_count, `${reports.executive_summary.sent_back_rate}% rework rate`, RotateCcw],
                    ].map(([label, value, helper, Icon]) => {
                        const StatIcon = Icon as typeof FileSpreadsheet;
                        return (
                            <Card key={String(label)} className="shadow-sm">
                                <CardContent className="p-5">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/20">
                                        <StatIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                                    <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</div>
                                    <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-muted-foreground" />Workflow Pipeline Report</CardTitle>
                            <CardDescription>Exact appraisal volume and percentage share by workflow stage.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reports.workflow_pipeline.length > 0 ? (
                                <ChartContainer config={workflowConfig} className="h-[320px] w-full">
                                    <BarChart data={reports.workflow_pipeline} margin={{ left: 8, right: 8, top: 8 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} tickFormatter={(value) => String(value).replace(' Assessment', '')} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                                        <ChartTooltip cursor={false} content={(props) => <ChartTooltipContent {...props} formatter={(value) => `${value} reviews`} />} />
                                        <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 0, 0]} maxBarSize={46} />
                                    </BarChart>
                                </ChartContainer>
                            ) : <EmptyState message="No workflow records are available for this filter." />}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-muted-foreground" />Overdue Analysis</CardTitle>
                            <CardDescription>Severity, average age, and oldest missed-deadline item.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                                <div className="rounded-lg border bg-muted/10 p-4">
                                    <div className="text-xs text-muted-foreground">Total overdue</div>
                                    <div className="mt-1 text-2xl font-bold">{reports.overdue_analysis.total_overdue}</div>
                                </div>
                                <div className="rounded-lg border bg-muted/10 p-4">
                                    <div className="text-xs text-muted-foreground">Average days overdue</div>
                                    <div className="mt-1 text-2xl font-bold">{reports.overdue_analysis.average_days_overdue}</div>
                                </div>
                                <div className="rounded-lg border bg-muted/10 p-4">
                                    <div className="text-xs text-muted-foreground">Oldest overdue</div>
                                    <div className="mt-1 text-2xl font-bold">{reports.overdue_analysis.oldest_days_overdue} days</div>
                                </div>
                            </div>
                            {reports.overdue_analysis.buckets.some((bucket) => bucket.total > 0) ? (
                                <ChartContainer config={overdueConfig} className="h-[220px] w-full">
                                    <BarChart data={reports.overdue_analysis.buckets} margin={{ left: 8, right: 8, top: 8 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                                        <ChartTooltip cursor={false} content={(props) => <ChartTooltipContent {...props} formatter={(value) => `${value} overdue`} />} />
                                        <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 0, 0]} maxBarSize={46} />
                                    </BarChart>
                                </ChartContainer>
                            ) : null}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-muted-foreground" />Department Performance And Risk</CardTitle>
                            <CardDescription>Completion, effective average score, overdue rate, and rework volume by department.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reports.department_breakdown.length > 0 ? (
                                <div className="space-y-4">
                                    {reports.department_breakdown.map((department) => (
                                        <div key={department.department} className="rounded-xl border bg-muted/10 p-4">
                                            <div className="mb-4 flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="font-semibold text-foreground">{department.department}</div>
                                                    <div className="text-xs text-muted-foreground">{department.total} reviews | {department.finalized} finalized | {department.sent_back_count} sent back</div>
                                                </div>
                                                <Badge variant="outline" className={riskClass(department.risk_level)}>{department.risk_level} risk</Badge>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-3">
                                                <div>
                                                    <div className="mb-1 text-xs text-muted-foreground">Completion {department.completion_rate}%</div>
                                                    <ProgressLine value={department.completion_rate} tone="bg-emerald-500" />
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-xs text-muted-foreground">Effective score {department.average_score}</div>
                                                    <ProgressLine value={department.average_score} tone="bg-sky-500" />
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-xs text-muted-foreground">Overdue {department.overdue_rate}%</div>
                                                    <ProgressLine value={department.overdue_rate} tone="bg-red-500" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyState message="No department data is available for this filter." />}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" />Manager Accountability</CardTitle>
                            <CardDescription>Assigned work, manager-review backlog, overdue work, sent-back count, and turnaround.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reports.manager_accountability.length > 0 ? (
                                <div className="space-y-5">
                                    <ChartContainer config={managerConfig} className="h-[260px] w-full">
                                        <BarChart data={reports.manager_accountability} layout="vertical" margin={{ left: 28, right: 8, top: 8 }}>
                                            <CartesianGrid horizontal={false} />
                                            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                                            <YAxis type="category" dataKey="manager" tickLine={false} axisLine={false} width={96} />
                                            <ChartTooltip cursor={false} content={(props) => <ChartTooltipContent {...props} />} />
                                            <Bar dataKey="pending_manager_reviews" fill="var(--color-pending_manager_reviews)" radius={[0, 8, 8, 0]} maxBarSize={28} />
                                            <Bar dataKey="overdue_reviews" fill="var(--color-overdue_reviews)" radius={[0, 8, 8, 0]} maxBarSize={28} />
                                        </BarChart>
                                    </ChartContainer>
                                    <MiniTable
                                        headers={['Manager', 'Assigned', 'Pending', 'Overdue', 'Rework', 'Turnaround']}
                                        rows={reports.manager_accountability.map((manager) => [
                                            manager.manager,
                                            manager.assigned_reviews,
                                            manager.pending_manager_reviews,
                                            manager.overdue_reviews,
                                            manager.sent_back_count,
                                            `${manager.average_turnaround_days} days`,
                                        ])}
                                    />
                                </div>
                            ) : <EmptyState message="No manager accountability data is available for this filter." />}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5 text-muted-foreground" />Rating Quality And Cycle Movement</CardTitle>
                            <CardDescription>Effective score quality, business-values gap, and comparison to the previous cycle.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    ['Average', reports.rating_quality.average_score],
                                    ['Median', reports.rating_quality.median_score],
                                    ['Highest', reports.rating_quality.highest_score],
                                    ['Lowest', reports.rating_quality.lowest_score],
                                    ['Spread', reports.rating_quality.score_spread],
                                    ['B/V Gap', reports.rating_quality.business_values_gap],
                                ].map(([label, value]) => (
                                    <div key={String(label)} className="rounded-lg border bg-muted/10 p-4">
                                        <div className="text-xs text-muted-foreground">{label}</div>
                                        <div className="mt-1 text-2xl font-bold">{value}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-lg border bg-muted/10 p-4">
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Business average</span>
                                    <span className="font-medium">{reports.rating_quality.business_average}</span>
                                </div>
                                <ProgressLine value={reports.rating_quality.business_average} tone="bg-sky-500" />
                                <div className="mb-2 mt-4 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Values average</span>
                                    <span className="font-medium">{reports.rating_quality.values_average}</span>
                                </div>
                                <ProgressLine value={reports.rating_quality.values_average} tone="bg-violet-500" />
                            </div>
                            <div className="rounded-lg border bg-muted/10 p-4 text-sm">
                                <div className="font-medium text-foreground">Cycle comparison</div>
                                <div className="mt-2 text-muted-foreground">
                                    {reports.cycle_comparison.current_cycle} vs {reports.cycle_comparison.previous_cycle ?? 'no previous cycle'}
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <Badge variant="outline">Effective score {formatDelta(reports.cycle_comparison.average_score_delta)}</Badge>
                                    <Badge variant="outline">Completion {formatDelta(reports.cycle_comparison.completion_rate_delta, '%')}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-muted-foreground" />Employee Exception Report</CardTitle>
                            <CardDescription>Employees requiring intervention because of overdue work, rework, or finalized records missing scores.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reports.employee_exception_report.length > 0 ? (
                                <MiniTable
                                    headers={['Employee', 'Department', 'Status', 'Manager', 'Exception', 'Days']}
                                    rows={reports.employee_exception_report.slice(0, 12).map((employee) => [
                                        `${employee.employee} (${employee.employee_number})`,
                                        employee.department ?? 'Unassigned',
                                        labelize(employee.status),
                                        employee.manager,
                                        employee.flags,
                                        employee.days_overdue,
                                    ])}
                                />
                            ) : <EmptyState message="No employee exceptions are present for this filter." />}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                § Employee movement
                            </div>
                            <h2 className="font-display text-foreground mt-2 text-2xl font-light tracking-tight">
                                Employee Performance Movement
                            </h2>
                            <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
                                Effective score movement across finalized cycles, trend classification, and same-scorecard peer comparison for {selectedCycleLabel}.
                            </p>
                        </div>
                        <ReportExportButtons
                            exportKey="employee-performance-movement"
                            reportTitle="Employee Performance Movement"
                            reviewCycleId={filters.review_cycle_id ?? null}
                            className="flex flex-wrap gap-2"
                            size="sm"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        {[
                            ['Improving', reports.employee_performance_movement.summary.improving, 'improving'],
                            ['Declining', reports.employee_performance_movement.summary.declining, 'declining'],
                            ['Stable', reports.employee_performance_movement.summary.stable, 'stable'],
                            ['Insufficient Data', reports.employee_performance_movement.summary.insufficient_data, 'insufficient_data'],
                        ].map(([label, count, status]) => (
                            <div key={String(label)} className="rounded-xl border bg-muted/10 p-4">
                                <Badge variant="outline" className={trendBadgeClass(String(status))}>{label}</Badge>
                                <div className="font-display text-foreground mt-3 text-3xl font-light">{count}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-3">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-muted-foreground" />Top Improving</CardTitle>
                                <CardDescription>Largest positive effective score deltas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reports.employee_performance_movement.top_improving.length > 0 ? (
                                    <MiniTable
                                        headers={['Employee', 'Previous', 'Current', 'Delta']}
                                        rows={reports.employee_performance_movement.top_improving.map((row) => [
                                            row.employee_name,
                                            row.previous_score ?? '—',
                                            row.current_score ?? '—',
                                            row.score_delta ?? '—',
                                        ])}
                                    />
                                ) : <EmptyState message="No improving employees matched this filter." />}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-muted-foreground" />Top Declining</CardTitle>
                                <CardDescription>Largest negative effective score deltas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reports.employee_performance_movement.top_declining.length > 0 ? (
                                    <MiniTable
                                        headers={['Employee', 'Previous', 'Current', 'Delta']}
                                        rows={reports.employee_performance_movement.top_declining.map((row) => [
                                            row.employee_name,
                                            row.previous_score ?? '—',
                                            row.current_score ?? '—',
                                            row.score_delta ?? '—',
                                        ])}
                                    />
                                ) : <EmptyState message="No declining employees matched this filter." />}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5 text-muted-foreground" />Stable Employees</CardTitle>
                                <CardDescription>Employees with unchanged effective scores.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reports.employee_performance_movement.stable_employees.length > 0 ? (
                                    <MiniTable
                                        headers={['Employee', 'Cycle', 'Score']}
                                        rows={reports.employee_performance_movement.stable_employees.map((row) => [
                                            row.employee_name,
                                            row.current_cycle_name ?? '—',
                                            row.current_score ?? '—',
                                        ])}
                                    />
                                ) : <EmptyState message="No stable employees matched this filter." />}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" />Same-Scorecard Comparison</CardTitle>
                            <CardDescription>Peer ranking within matching appraisal templates for the selected cycle context.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {reports.employee_performance_movement.scorecard_comparison.length > 0 ? (
                                <MiniTable
                                    headers={['Employee', 'Department', 'Scorecard', 'Previous', 'Current', 'Delta', 'Trend', 'Rank']}
                                    rows={reports.employee_performance_movement.scorecard_comparison.slice(0, 20).map((row) => movementRowCells(row))}
                                />
                            ) : <EmptyState message="No same-scorecard comparison rows are available for this filter." />}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    {[
                        ['Cycle Summary', 'performance.reports.cycle_summary', 'Cycle-level totals, completion, and effective score movement.', BarChart3, 'cycle-summary'],
                        ['Department Summary', 'performance.reports.department_summary', 'Department-level completion and effective score detail.', Building2, 'department-summary'],
                        ['Employee Summary', 'performance.reports.employee_summary', 'Per-employee appraisal outcomes and effective scores.', UserRound, 'employee-summary'],
                        ['Completion Status', 'performance.reports.completion_status', 'Workflow status counts and completion position.', CheckCircle2, 'completion-status'],
                        ['Rating Distribution', 'performance.reports.rating_distribution', 'Effective rating mix and rating spread.', TrendingUp, 'rating-distribution'],
                        ['Overdue Reviews', 'performance.reports.overdue_reviews', 'Deadline misses with manager and approver context.', Clock3, 'overdue-reviews'],
                    ].map(([title, routeName, description, Icon, exportKey]) => {
                        const ReportIcon = Icon as typeof BarChart3;
                        return (
                            <Card key={String(title)} className="shadow-sm">
                                <CardContent className="flex items-start gap-4 p-5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/20">
                                        <ReportIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-foreground">{title}</div>
                                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                                        <Button asChild variant="link" className="mt-2 h-auto p-0">
                                            <Link href={route(String(routeName), { review_cycle_id: filters.review_cycle_id ?? undefined })}>
                                                Open detailed table
                                                <ArrowRight className="ml-1 h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <ReportExportButtons
                                            exportKey={String(exportKey)}
                                            reportTitle={String(title)}
                                            reviewCycleId={filters.review_cycle_id ?? null}
                                            className="mt-4 flex flex-wrap gap-2"
                                            size="sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>
            </div>
        </PerformancePage>
    );
}
