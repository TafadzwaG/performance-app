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
import { ArrowRight, BarChart3, CalendarRange, CheckCheck, CircleAlert, Clock3, FileText, FolderKanban, Gauge, Layers3, ShieldCheck, Target, Users } from 'lucide-react';
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
    total: { label: 'Appraisals', theme: { light: 'hsl(0 0% 9%)', dark: 'hsl(0 0% 98%)' } },
} satisfies ChartConfig;

const cycleChartConfig = {
    average_score: { label: 'Average score', theme: { light: 'hsl(0 0% 15%)', dark: 'hsl(0 0% 92%)' } },
} satisfies ChartConfig;

const deadlineChartConfig = {
    total: { label: 'Overdue items', theme: { light: 'hsl(0 0% 12%)', dark: 'hsl(0 0% 94%)' } },
} satisfies ChartConfig;

const pieColors = ['hsl(0 0% 8%)', 'hsl(0 0% 22%)', 'hsl(0 0% 38%)', 'hsl(0 0% 56%)', 'hsl(0 0% 72%)', 'hsl(0 0% 84%)'];

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
    return dueDate ? isBefore(parseISO(dueDate), new Date()) && !['approved', 'finalized'].includes(appraisal.status) : false;
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed bg-muted/10 px-6 text-center text-sm text-muted-foreground">
            {message}
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
                                    {appraisal.overall_score !== null && appraisal.overall_score !== undefined ? <Badge variant="outline">{appraisal.overall_score} overall</Badge> : null}
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
                                        <div className="rounded-xl border bg-background px-4 py-3 text-sm">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Completion Rate</div>
                                            <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">{focusCycle.completion_rate}%</div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            {focusCycle ? (
                                <div className="grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr]">
                                    <div className="space-y-6">
                                        <div>
                                            <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                <span>Cycle completion</span>
                                                <span>{focusCycle.finalized_count} finalized</span>
                                            </div>
                                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(focusCycle.completion_rate, 100)}%` }} />
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
                            <CardDescription>Average overall score across the most recent visible cycles.</CardDescription>
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
                            <CardDescription>Highest-performing departments by visible average overall score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dashboard.department_performance.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboard.department_performance.map((department) => (
                                        <div key={department.department} className="rounded-xl border bg-muted/10 p-4">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="font-semibold text-foreground">{department.department}</div>
                                                    <div className="text-xs text-muted-foreground">{department.total} appraisals scored</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold tracking-tight text-foreground">{department.average_score}</div>
                                                    <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Average</div>
                                                </div>
                                            </div>
                                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(department.average_score, 100)}%` }} />
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
                                <CardDescription>Final mapped ratings across visible completed appraisals.</CardDescription>
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
                                ) : <EmptyState message="No final rating distribution is available yet." />}
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
