import AppraisalStatusBadge from '@/components/performance/AppraisalStatusBadge';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal } from '@/types/performance';
import { Link, usePage } from '@inertiajs/react';
import { format, isBefore, parseISO } from 'date-fns';
import {
    Activity,
    ArrowRight,
    BarChart3,
    CalendarRange,
    CheckCheck,
    CircleAlert,
    ClipboardCheck,
    Clock3,
    FileText,
    FolderKanban,
    Gauge,
    GitCompareArrows,
    Layers3,
    RotateCcw,
    ShieldCheck,
    Target,
    TrendingUp,
    UserCheck,
    Users,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart as RechartsPieChart, XAxis, YAxis } from 'recharts';

type Props = {
    dashboard: {
        metrics: Record<string, number>;
        focus_cycle: {
            id: number;
            name: string;
            code: string;
            status: string;
            end_date?: string | null;
            goal_setting_deadline?: string | null;
            self_assessment_deadline?: string | null;
            manager_review_deadline?: string | null;
            approval_deadline?: string | null;
            appraisals_count: number;
            self_assessment_pending_count: number;
            manager_review_pending_count: number;
            approval_pending_count: number;
            finalized_count: number;
            completion_rate: number;
        } | null;
        workflow_distribution: Array<{ status: string; total: number }>;
        rating_distribution: Array<{ rating: string; total: number }>;
        cycle_performance: Array<{ cycle: string; total: number; average_score: number }>;
        department_performance: Array<{ department: string; total: number; average_score: number }>;
        deadline_pressure: Array<{ stage: string; total: number }>;
        stage_completion: Array<{ stage: string; completed: number; total: number; completion_rate: number }>;
        overdue_severity: Array<{ bucket: string; total: number; average_days_overdue: number; oldest_days_overdue: number }>;
        cycle_health: {
            score: number;
            status: 'green' | 'amber' | 'red' | 'inactive';
            completion_rate: number;
            overdue_rate: number;
            pending_approvals: number;
            days_until_close: number | null;
        };
        manager_workload: Array<{ manager: string; pending_reviews: number; average_turnaround_days: number; overdue_reviews: number }>;
        department_risk: Array<{ department: string; total: number; completion_rate: number; overdue_rate: number; average_score: number; risk_score: number }>;
        score_quality: {
            average_score: number;
            median_score: number;
            score_spread: number;
            business_values_gap: number;
            unrated_finalized_reviews: number;
        };
        rework: { sent_back_count: number; sent_back_rate: number };
        coverage: { eligible_employees: number; assigned_employees: number; unassigned_employees: number; coverage_rate: number };
        trend_deltas: { completion_rate_delta: number; average_score_delta: number; overdue_reviews_delta: number; finalized_reviews_delta: number };
        action_summary: { my_self_assessments_due: number; manager_reviews_due: number; approvals_due: number; overdue_assigned_to_me: number };
    };
    myAppraisals: Appraisal[];
    teamPending: Appraisal[];
    approvalQueue: Appraisal[];
    overdueQueue: Appraisal[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const metricMeta = {
    my_open_appraisals: { label: 'My Open Appraisals', helper: 'Still in progress', icon: FolderKanban },
    team_pending_reviews: { label: 'Team Pending Reviews', helper: 'Awaiting manager action', icon: Users },
    pending_approvals: { label: 'Pending Approvals', helper: 'Ready for approval', icon: ShieldCheck },
    overdue_reviews: { label: 'Overdue Reviews', helper: 'Past deadline', icon: CircleAlert },
    open_cycles: { label: 'Open Cycles', helper: 'Active review windows', icon: CalendarRange },
    finalized_reviews: { label: 'Finalized Reviews', helper: 'Closed and reportable', icon: CheckCheck },
} as const;

const workflowChartConfig = {
    total: { label: 'Appraisals', theme: { light: 'var(--chart-1)', dark: 'var(--chart-1)' } },
} satisfies ChartConfig;

const cycleChartConfig = {
    average_score: { label: 'Average effective score', theme: { light: 'var(--chart-4)', dark: 'var(--chart-4)' } },
} satisfies ChartConfig;

const deadlineChartConfig = {
    total: { label: 'Overdue items', theme: { light: 'var(--chart-3)', dark: 'var(--chart-3)' } },
} satisfies ChartConfig;

const stageChartConfig = {
    completion_rate: { label: 'Completion %', theme: { light: 'var(--chart-1)', dark: 'var(--chart-1)' } },
} satisfies ChartConfig;

const severityChartConfig = {
    total: { label: 'Overdue count', theme: { light: 'var(--destructive)', dark: 'var(--destructive)' } },
} satisfies ChartConfig;

const workloadChartConfig = {
    pending_reviews: { label: 'Pending reviews', theme: { light: 'var(--chart-2)', dark: 'var(--chart-2)' } },
    overdue_reviews: { label: 'Overdue reviews', theme: { light: 'var(--destructive)', dark: 'var(--destructive)' } },
} satisfies ChartConfig;

const pieColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', '#385144'];

function normalizePercent(value: number) {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
}

function labelize(value: string) {
    return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateLabel(value?: string | null) {
    if (!value) return 'Not set';
    try {
        return format(parseISO(value), 'dd MMM yyyy');
    } catch {
        return value;
    }
}

function formatCompactDate(value?: string | null) {
    if (!value) return null;
    try {
        return format(parseISO(value), 'd MMM');
    } catch {
        return value;
    }
}

function formatDelta(value: number, suffix = '') {
    if (value === 0) return `0${suffix}`;
    return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

function healthTone(status?: string) {
    switch (status) {
        case 'green':
            return {
                label: 'Green',
                className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                bar: 'bg-emerald-500',
            };
        case 'amber':
            return {
                label: 'Amber',
                className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                bar: 'bg-amber-500',
            };
        case 'red':
            return {
                label: 'Red',
                className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
                bar: 'bg-red-500',
            };
        default:
            return {
                label: 'Inactive',
                className: 'border-muted bg-muted/20 text-muted-foreground',
                bar: 'bg-muted-foreground',
            };
    }
}

function dueDateFor(appraisal: Appraisal) {
    const cycle = appraisal.review_cycle;
    if (!cycle) return null;

    switch (appraisal.status) {
        case 'goal_setting':
            return cycle.goal_setting_deadline;
        case 'self_assessment_pending':
            return cycle.self_assessment_deadline;
        case 'self_assessment_submitted':
        case 'manager_review_pending':
        case 'manager_review_completed':
            return cycle.manager_review_deadline;
        case 'approval_pending':
            return cycle.approval_deadline;
        default:
            return cycle.end_date;
    }
}

function isOverdue(appraisal: Appraisal) {
    const dueDate = dueDateFor(appraisal);
    return dueDate ? isBefore(parseISO(dueDate), new Date()) && !['calibration_pending', 'finalized'].includes(appraisal.status) : false;
}

function effectiveOverallScore(appraisal: Appraisal) {
    return appraisal.calibrated_overall_score ?? appraisal.overall_score;
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed bg-muted/10 px-6 text-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}

function DonutPercentage({
    value,
    label,
    size = 96,
}: {
    value: number;
    label: string;
    size?: number;
}) {
    const safeValue = normalizePercent(value);
    const remaining = Math.max(0, 100 - safeValue);
    const donutData = [
        { name: 'value', value: safeValue, fill: 'var(--chart-1)' },
        { name: 'remaining', value: remaining, fill: 'var(--muted)' },
    ];

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: size, height: size }}>
                <RechartsPieChart width={size} height={size}>
                    <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={Math.round(size * 0.33)}
                        outerRadius={Math.round(size * 0.46)}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                    >
                        {donutData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                        ))}
                    </Pie>
                </RechartsPieChart>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                    <span className="text-sm font-semibold text-foreground">{Math.round(safeValue)}%</span>
                </div>
            </div>
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        </div>
    );
}

function QueueCard({ title, description, items }: { title: string; description: string; items: Appraisal[] }) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <div className="space-y-3">
                        {items.map((appraisal) => (
                            <Link key={appraisal.id} href={route('performance.appraisals.show', appraisal.id)} className="block rounded-xl border p-4 transition-colors hover:bg-muted/10">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-foreground">{appraisal.employee_name_snapshot}</div>
                                        <div className="text-sm text-muted-foreground">{appraisal.cycle_name_snapshot}</div>
                                        <div className="text-xs text-muted-foreground">{appraisal.template_name_snapshot}</div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <AppraisalStatusBadge status={appraisal.status} />
                                        {dueDateFor(appraisal) ? <span className="text-xs text-muted-foreground">Due {formatCompactDate(dueDateFor(appraisal))}</span> : null}
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    {appraisal.department_name_snapshot ? <Badge variant="outline">{appraisal.department_name_snapshot}</Badge> : null}
                                    {effectiveOverallScore(appraisal) !== null && effectiveOverallScore(appraisal) !== undefined ? <Badge variant="outline">{effectiveOverallScore(appraisal)} effective</Badge> : null}
                                    {isOverdue(appraisal) ? <Badge variant="outline" className="border-destructive/30 text-destructive">Overdue</Badge> : null}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">No items in this queue right now.</div>
                )}
            </CardContent>
        </Card>
    );
}

function ProgressLine({ value, tone = 'bg-primary' }: { value: number; tone?: string }) {
    return (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${normalizePercent(value)}%` }} />
        </div>
    );
}

export default function DashboardIndex({ dashboard, myAppraisals, teamPending, approvalQueue, overdueQueue }: Props) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const metrics = Object.entries(dashboard.metrics ?? {}).map(([key, value]) => ({ key, value, ...(metricMeta[key as keyof typeof metricMeta] ?? { label: labelize(key), helper: 'Dashboard metric', icon: Gauge }) }));
    const focusCycle = dashboard.focus_cycle;

    return (
        <PerformancePage
            title="Performance Dashboard"
            description="Track live workflow health, score trends, and queue pressure across the appraisal system."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <>
                    <Button asChild variant="outline">
                        <Link href={route('performance.appraisals.index')}>Appraisals<ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    {permissions.has('performance.reports.view') ? (
                        <Button asChild variant="outline">
                            <Link href={route('performance.reports.index')}>Reports<ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    ) : null}
                </>
            }
        >
            <div className="space-y-8">
                <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                    <Card className="overflow-hidden border shadow-sm">
                        <CardContent className="p-0">
                            <div className="border-b bg-muted/15 px-8 py-7">
                                <Badge variant="secondary" className="mb-3 w-fit">Live overview</Badge>
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{focusCycle ? focusCycle.name : 'No open review cycle'}</h2>
                                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                                            {focusCycle ? `${focusCycle.code} is the current operating cycle. Use this dashboard to track completion, queues, and risk areas.` : 'Open a review cycle to activate operational tracking, review queues, and score analytics.'}
                                        </p>
                                    </div>
                                    {focusCycle ? (
                                        <div className="rounded-xl border bg-background px-4 py-3">
                                            <DonutPercentage value={focusCycle.completion_rate} label="Completion Rate" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            {focusCycle ? (
                                <div className="grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr]">
                                    <div className="space-y-6">
                                        <div className="rounded-xl border bg-muted/10 p-4">
                                            <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                <span>Cycle progress</span>
                                                <span>{focusCycle.finalized_count} finalized</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <DonutPercentage value={focusCycle.completion_rate} label="Finalized" />
                                                <div className="flex-1">
                                                    <div className="text-sm text-muted-foreground">
                                                        {focusCycle.finalized_count} of {focusCycle.appraisals_count} appraisals finalized in this cycle.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                            {[
                                                ['Appraisals', focusCycle.appraisals_count],
                                                ['Self Pending', focusCycle.self_assessment_pending_count],
                                                ['Mgr Pending', focusCycle.manager_review_pending_count],
                                                ['Approval', focusCycle.approval_pending_count],
                                            ].map(([label, value]) => (
                                                <div key={String(label)} className="rounded-xl border bg-muted/10 px-4 py-4">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                                                    <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid gap-3">
                                        {[
                                            ['Goal setting', focusCycle.goal_setting_deadline],
                                            ['Self assessment', focusCycle.self_assessment_deadline],
                                            ['Manager review', focusCycle.manager_review_deadline],
                                            ['Approval', focusCycle.approval_deadline],
                                            ['Cycle closes', focusCycle.end_date],
                                        ].map(([label, value]) => (
                                            <div key={String(label)} className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3">
                                                <span className="text-sm text-muted-foreground">{label}</span>
                                                <span className="text-sm font-medium text-foreground">{formatDateLabel(String(value ?? ''))}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-8 py-10 text-sm text-muted-foreground">There is currently no open cycle.</div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-6">
                        {metrics.map((metric) => {
                            const Icon = metric.icon;
                            return (
                                <Card key={metric.key} className="shadow-sm">
                                    <CardContent className="flex items-center justify-between p-6">
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</div>
                                            <div className="mt-3 text-4xl font-bold tracking-tight text-foreground">{metric.value}</div>
                                            <p className="mt-2 text-sm text-muted-foreground">{metric.helper}</p>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/20">
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-muted-foreground" />Cycle Health</CardTitle>
                            <CardDescription>Composite cycle signal using completion, overdue pressure, approvals, and cycle close timing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(() => {
                                const tone = healthTone(dashboard.cycle_health?.status);
                                return (
                                    <>
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="text-5xl font-bold tracking-tight text-foreground">{dashboard.cycle_health.score}</div>
                                                <div className="mt-2 text-sm text-muted-foreground">Health score out of 100</div>
                                            </div>
                                            <Badge variant="outline" className={tone.className}>{tone.label}</Badge>
                                        </div>
                                        <ProgressLine value={dashboard.cycle_health.score} tone={tone.bar} />
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {[
                                                ['Completion', `${dashboard.cycle_health.completion_rate}%`],
                                                ['Overdue rate', `${dashboard.cycle_health.overdue_rate}%`],
                                                ['Pending approvals', dashboard.cycle_health.pending_approvals],
                                                ['Days until close', dashboard.cycle_health.days_until_close ?? 'Not set'],
                                            ].map(([label, value]) => (
                                                <div key={String(label)} className="rounded-lg border bg-muted/10 px-4 py-3">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                                                    <div className="mt-1 text-xl font-bold text-foreground">{value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-muted-foreground" />Needs Your Action</CardTitle>
                            <CardDescription>Role-specific queues that should be handled first.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    ['Self Assessments', dashboard.action_summary.my_self_assessments_due, UserCheck],
                                    ['Manager Reviews', dashboard.action_summary.manager_reviews_due, Users],
                                    ['Approvals', dashboard.action_summary.approvals_due, ShieldCheck],
                                    ['Overdue Assigned', dashboard.action_summary.overdue_assigned_to_me, CircleAlert],
                                ].map(([label, value, Icon]) => {
                                    const ActionIcon = Icon as typeof UserCheck;
                                    return (
                                        <div key={String(label)} className="rounded-xl border bg-muted/10 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/20">
                                                    <ActionIcon className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
                                            </div>
                                            <div className="mt-4 text-sm font-medium text-foreground">{label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CheckCheck className="h-5 w-5 text-muted-foreground" />Stage Completion</CardTitle>
                            <CardDescription>Completion rate for each major appraisal stage in the active cycle.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboard.stage_completion.length > 0 ? (
                                <ChartContainer config={stageChartConfig} className="h-[260px] w-full">
                                    <BarChart data={dashboard.stage_completion} margin={{ left: 8, right: 8, top: 8 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="stage" tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={36} tickFormatter={(value) => `${value}%`} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={(props) => <ChartTooltipContent {...props} formatter={(value) => `${value}% complete`} />}
                                        />
                                        <Bar dataKey="completion_rate" fill="var(--color-completion_rate)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                </ChartContainer>
                            ) : <EmptyState message="Stage completion appears once appraisals are assigned." />}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-muted-foreground" />Overdue Severity</CardTitle>
                            <CardDescription>Missed-deadline work grouped by how long it has been overdue.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboard.overdue_severity.some((item) => item.total > 0) ? (
                                <ChartContainer config={severityChartConfig} className="h-[260px] w-full">
                                    <BarChart data={dashboard.overdue_severity} margin={{ left: 8, right: 8, top: 8 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={(props) => <ChartTooltipContent {...props} formatter={(value) => `${value} overdue`} />}
                                        />
                                        <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                </ChartContainer>
                            ) : <EmptyState message="There are no overdue items to age right now." />}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-muted-foreground" />Department Risk</CardTitle>
                            <CardDescription>Departments ranked by incomplete reviews, overdue pressure, and lower score signals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboard.department_risk.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboard.department_risk.map((department) => (
                                        <div key={department.department} className="rounded-xl border bg-muted/10 p-4">
                                            <div className="mb-3 flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="font-semibold text-foreground">{department.department}</div>
                                                    <div className="text-xs text-muted-foreground">{department.total} active-cycle appraisals</div>
                                                </div>
                                                <Badge variant="outline" className="border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300">{department.risk_score} risk</Badge>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                <div>
                                                    <div className="mb-1 text-xs text-muted-foreground">Completion {department.completion_rate}%</div>
                                                    <ProgressLine value={department.completion_rate} tone="bg-emerald-500" />
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-xs text-muted-foreground">Overdue {department.overdue_rate}%</div>
                                                    <ProgressLine value={department.overdue_rate} tone="bg-red-500" />
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-xs text-muted-foreground">Effective avg {department.average_score}</div>
                                                    <ProgressLine value={department.average_score} tone="bg-sky-500" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyState message="Department risk appears when active-cycle appraisals exist." />}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" />Manager Workload</CardTitle>
                            <CardDescription>Pending and overdue review volume by line manager.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboard.manager_workload.length > 0 ? (
                                <ChartContainer config={workloadChartConfig} className="h-[320px] w-full">
                                    <BarChart data={dashboard.manager_workload} layout="vertical" margin={{ left: 24, right: 8, top: 8 }}>
                                        <CartesianGrid horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="manager" tickLine={false} axisLine={false} width={96} />
                                        <ChartTooltip cursor={false} content={(props) => <ChartTooltipContent {...props} />} />
                                        <Bar dataKey="pending_reviews" fill="var(--color-pending_reviews)" radius={[0, 8, 8, 0]} maxBarSize={28} />
                                        <Bar dataKey="overdue_reviews" fill="var(--color-overdue_reviews)" radius={[0, 8, 8, 0]} maxBarSize={28} />
                                    </BarChart>
                                </ChartContainer>
                            ) : <EmptyState message="Manager workload appears once teams have assigned appraisals." />}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            title: 'Effective Score Quality',
                            icon: TrendingUp,
                            value: dashboard.score_quality.average_score,
                            helper: `Median ${dashboard.score_quality.median_score} | spread ${dashboard.score_quality.score_spread}`,
                        },
                        {
                            title: 'Business vs Values Gap',
                            icon: GitCompareArrows,
                            value: dashboard.score_quality.business_values_gap,
                            helper: `${dashboard.score_quality.unrated_finalized_reviews} finalized reviews unrated`,
                        },
                        {
                            title: 'Rework Rate',
                            icon: RotateCcw,
                            value: `${dashboard.rework.sent_back_rate}%`,
                            helper: `${dashboard.rework.sent_back_count} reviews sent back`,
                        },
                        {
                            title: 'Cycle Coverage',
                            icon: UserCheck,
                            value: `${dashboard.coverage.coverage_rate}%`,
                            helper: `${dashboard.coverage.unassigned_employees} eligible employees unassigned`,
                        },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card key={item.title} className="shadow-sm">
                                <CardContent className="p-6">
                                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/20">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.title}</div>
                                    <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{item.value}</div>
                                    <p className="mt-2 text-sm text-muted-foreground">{item.helper}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Completion Delta', formatDelta(dashboard.trend_deltas.completion_rate_delta, '%'), 'vs previous cycle'],
                        ['Effective Score Delta', formatDelta(dashboard.trend_deltas.average_score_delta), 'vs previous cycle'],
                        ['Overdue Delta', formatDelta(dashboard.trend_deltas.overdue_reviews_delta), 'overdue reviews'],
                        ['Finalized Delta', formatDelta(dashboard.trend_deltas.finalized_reviews_delta), 'finalized reviews'],
                    ].map(([label, value, helper]) => (
                        <Card key={label} className="shadow-sm">
                            <CardContent className="flex items-center justify-between gap-4 p-5">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                                    <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
                                    <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/20">
                                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-muted-foreground" />Workflow Distribution</CardTitle>
                            <CardDescription>Visible appraisal volume grouped by workflow stage.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboard.workflow_distribution.length > 0 ? (
                                <ChartContainer config={workflowChartConfig} className="h-[280px] w-full">
                                    <BarChart data={dashboard.workflow_distribution} margin={{ left: 8, right: 8, top: 8 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={10} interval={0} tickFormatter={(value) => labelize(String(value)).replace(' Assessment', '')} />
                                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={(props) => <ChartTooltipContent {...props} labelFormatter={(label) => labelize(String(label))} />}
                                        />
                                        <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 0, 0]} maxBarSize={42} />
                                    </BarChart>
                                </ChartContainer>
                            ) : <EmptyState message="No workflow data available yet." />}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-muted-foreground" />Cycle Performance Trend</CardTitle>
                            <CardDescription>Average effective score across the most recent visible cycles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboard.cycle_performance.length > 0 ? (
                                <ChartContainer config={cycleChartConfig} className="h-[280px] w-full">
                                    <AreaChart data={dashboard.cycle_performance} margin={{ left: 8, right: 8, top: 8 }}>
                                        <defs>
                                            <linearGradient id="dashboard-cycle-score" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-average_score)" stopOpacity={0.28} />
                                                <stop offset="95%" stopColor="var(--color-average_score)" stopOpacity={0.03} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="cycle" tickLine={false} axisLine={false} tickMargin={10} />
                                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={36} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={(props) => (
                                                <ChartTooltipContent
                                                    {...props}
                                                    formatter={(value) => `${value} pts`}
                                                    labelFormatter={(label) => `Cycle: ${label}`}
                                                />
                                            )}
                                        />
                                        <Area type="monotone" dataKey="average_score" stroke="var(--color-average_score)" strokeWidth={2} fill="url(#dashboard-cycle-score)" />
                                    </AreaChart>
                                </ChartContainer>
                            ) : <EmptyState message="Cycle averages will appear once reviews start receiving scores." />}
                        </CardContent>
                    </Card>
                </section>
                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-muted-foreground" />Department Performance</CardTitle>
                            <CardDescription>Highest-performing departments by visible average effective score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboard.department_performance.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboard.department_performance.map((department) => (
                                        <div key={department.department} className="rounded-xl border bg-muted/10 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="font-semibold text-foreground">{department.department}</div>
                                                    <div className="text-xs text-muted-foreground">{department.total} appraisals scored</div>
                                                </div>
                                                <div className="text-right min-w-[84px]">
                                                    <div className="text-2xl font-bold tracking-tight text-foreground">{department.average_score}</div>
                                                    <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Effective</div>
                                                </div>
                                                <DonutPercentage value={department.average_score} label="Average" size={84} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyState message="Department trends will appear once enough appraisals are scored." />}
                        </CardContent>
                    </Card>

                    <div className="grid gap-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-muted-foreground" />Rating Distribution</CardTitle>
                                <CardDescription>Effective mapped ratings across visible completed appraisals.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {dashboard.rating_distribution.length > 0 ? (
                                    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                                        <ChartContainer
                                            config={Object.fromEntries(dashboard.rating_distribution.map((entry, index) => [entry.rating, { label: entry.rating, color: pieColors[index % pieColors.length] }]))}
                                            className="mx-auto h-[240px] w-full max-w-[280px]"
                                        >
                                            <RechartsPieChart>
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={(props) => <ChartTooltipContent {...props} nameKey="rating" labelFormatter={() => 'Rating mix'} />}
                                                />
                                                <Pie data={dashboard.rating_distribution} dataKey="total" nameKey="rating" innerRadius={54} outerRadius={88} paddingAngle={3}>
                                                    {dashboard.rating_distribution.map((entry, index) => (
                                                        <Cell key={entry.rating} fill={pieColors[index % pieColors.length]} />
                                                    ))}
                                                </Pie>
                                            </RechartsPieChart>
                                        </ChartContainer>
                                        <div className="space-y-3">
                                            {dashboard.rating_distribution.map((entry, index) => (
                                                <div key={entry.rating} className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                                                        <span className="text-sm text-foreground">{entry.rating}</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground">{entry.total}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : <EmptyState message="No effective rating distribution is available yet." />}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-muted-foreground" />Deadline Pressure</CardTitle>
                                <CardDescription>Overdue workload by review stage.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {dashboard.deadline_pressure.some((item) => item.total > 0) ? (
                                    <ChartContainer config={deadlineChartConfig} className="h-[220px] w-full">
                                        <BarChart data={dashboard.deadline_pressure} margin={{ left: 8, right: 8 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis dataKey="stage" tickLine={false} axisLine={false} tickMargin={10} />
                                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                                            <ChartTooltip
                                                cursor={false}
                                                content={(props) => <ChartTooltipContent {...props} formatter={(value) => `${value} overdue`} />}
                                            />
                                            <Bar dataKey="total" fill="var(--color-total)" radius={[8, 8, 0, 0]} maxBarSize={42} />
                                        </BarChart>
                                    </ChartContainer>
                                ) : <EmptyState message="No overdue pressure across the current visible workflow." />}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <QueueCard title="My Appraisals" description="Your most recent appraisal records and current workflow status." items={myAppraisals} />
                    <QueueCard title="Team Pending Reviews" description="Reviews currently waiting on manager action." items={teamPending} />
                    <QueueCard title="Approval Queue" description="Appraisals that have reached the approval stage." items={approvalQueue} />
                </section>

                <section>
                    <QueueCard title="Overdue Reviews" description="Appraisals with missed deadlines across self, manager, or approval stages." items={overdueQueue} />
                </section>
            </div>
        </PerformancePage>
    );
}
