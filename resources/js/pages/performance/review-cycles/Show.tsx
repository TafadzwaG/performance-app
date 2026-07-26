import PerformancePage from '@/components/performance/PerformancePage';
import AssignEmployeesModal from '@/components/performance/review-cycles/AssignEmployeesModal';
import AutomationReadinessBlockers from '@/components/performance/review-cycles/AutomationReadinessBlockers';
import CycleLaunchPanel from '@/components/performance/review-cycles/CycleLaunchPanel';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { Option, ReviewCycle, ReviewCycleAutomationReadiness } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Edit,
    Eye,
    FileText,
    FolderKanban,
    PlayCircle,
    RefreshCcw,
    Sparkles,
    Target,
    UserMinus,
    UserPlus,
    Users,
    XCircle,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';

interface Props {
    reviewCycle: ReviewCycle;
    statusCounts: Record<string, number>;
    templateOptions: Option[];
    employeeProfileOptions: Option[];
    can?: {
        assignEmployees?: boolean;
        open?: boolean;
        sync?: boolean;
    };
    automationReadiness?: ReviewCycleAutomationReadiness | null;
    perspectiveOptions?: Option[];
}

const breadcrumbs = (cycle: ReviewCycle): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Review Cycles', href: route('performance.review_cycles.index') },
    { title: cycle.name, href: route('performance.review_cycles.show', cycle.id) },
];

function normalizeStatus(value?: string | null) {
    return (value ?? 'unknown').replaceAll('_', ' ');
}

function titleCase(value?: string | null) {
    return normalizeStatus(value)
        .split(' ')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(' ');
}

function getStatusVariant(status?: string | null): 'default' | 'secondary' | 'outline' {
    const value = (status ?? '').toLowerCase();

    if (value.includes('open') || value.includes('active') || value.includes('progress')) {
        return 'default';
    }

    if (value.includes('closed') || value.includes('completed') || value.includes('final')) {
        return 'secondary';
    }

    return 'outline';
}

function getPhaseOrder(statusCounts: Record<string, number>) {
    const preferred = [
        'draft',
        'goal_setting',
        'self_assessment',
        'self_assessment_pending',
        'manager_review',
        'manager_review_pending',
        'approval',
        'approval_pending',
        'finalized',
        'closed',
    ];

    const keys = Object.keys(statusCounts);

    const ordered = preferred.filter((item) => keys.includes(item));
    const extra = keys.filter((item) => !preferred.includes(item));

    return [...ordered, ...extra];
}

export default function ReviewCycleShow({ reviewCycle, statusCounts, templateOptions, employeeProfileOptions, can, automationReadiness, perspectiveOptions = [] }: Props) {
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [openConfirmVisible, setOpenConfirmVisible] = useState(false);
    const orderedStatuses = getPhaseOrder(statusCounts);
    const totalAssessments = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const isDraft = reviewCycle.status === 'draft';
    const canLaunchCycle = Boolean(can?.open && isDraft && automationReadiness);

    const scrollToBlockers = () => {
        document.getElementById('automation-blockers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const activeCount = Object.entries(statusCounts).reduce((sum, [status, count]) => {
        const normalized = status.toLowerCase();
        if (
            normalized.includes('goal') ||
            normalized.includes('self') ||
            normalized.includes('manager') ||
            normalized.includes('approval') ||
            normalized.includes('open') ||
            normalized.includes('progress')
        ) {
            return sum + count;
        }
        return sum;
    }, 0);

    return (
        <PerformancePage
            title={reviewCycle.name}
            description="Cycle details, status counts, and assignment actions."
            breadcrumbs={breadcrumbs(reviewCycle)}
            secondaryActions={
                <>
                    <Button asChild variant="outline">
                        <Link href={route('performance.review_cycles.edit', reviewCycle.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>

                    {can?.assignEmployees && isDraft ? (
                        <Button type="button" variant="outline" onClick={() => setAssignModalOpen(true)}>
                            <Users className="mr-2 h-4 w-4" />
                            Assign Manually
                        </Button>
                    ) : null}

                    {can?.open && isDraft ? (
                        <Button
                            type="button"
                            variant={automationReadiness?.ready ? 'default' : 'secondary'}
                            onClick={() => (automationReadiness?.ready ? setOpenConfirmVisible(true) : scrollToBlockers())}
                        >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            {automationReadiness?.ready
                                ? `Open & Assign ${automationReadiness.eligible}`
                                : 'Review Blockers'}
                        </Button>
                    ) : null}

                    {can?.sync && reviewCycle.status === 'open' ? (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!automationReadiness?.ready || (automationReadiness?.to_create ?? 0) === 0}
                            onClick={() => {
                                if (window.confirm(`Add ${automationReadiness?.to_create ?? 0} newly eligible employee appraisal(s)?`)) {
                                    router.post(route('performance.review_cycles.sync_eligible', reviewCycle.id));
                                }
                            }}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Sync Eligible Employees
                        </Button>
                    ) : null}

                    {reviewCycle.status !== 'closed' ? (
                        <Button type="button" variant="outline" onClick={() => router.post(route('performance.review_cycles.close', reviewCycle.id))}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Close Cycle
                        </Button>
                    ) : null}
                </>
            }
        >
            <div className="space-y-6">
                <div className="bg-background rounded-2xl border p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Review cycle workspace
                            </Badge>

                            <div>
                                <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">{reviewCycle.name}</h1>
                                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                                    Cycle details, status counts, and assignment actions.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground text-xs tracking-wide uppercase">Code</div>
                                <div className="text-foreground mt-1 font-semibold">{reviewCycle.code}</div>
                            </div>

                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground text-xs tracking-wide uppercase">Status</div>
                                <div className="mt-1">
                                    <Badge variant={getStatusVariant(reviewCycle.status)}>{titleCase(reviewCycle.status)}</Badge>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground text-xs tracking-wide uppercase">Assigned</div>
                                <div className="text-foreground mt-1 font-semibold">{reviewCycle.appraisals_count ?? 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {automationReadiness ? (
                    <Card
                        className={
                            automationReadiness.ready
                                ? 'border-emerald-200/80 bg-emerald-50/20 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10'
                                : 'border-amber-200/80 bg-amber-50/10 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10'
                        }
                    >
                        <CardHeader className="border-b bg-background/60">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        {automationReadiness.ready ? (
                                            <CheckCircle2 className="size-5 text-emerald-600" />
                                        ) : (
                                            <AlertTriangle className="size-5 text-amber-600" />
                                        )}
                                        Automation readiness
                                    </CardTitle>
                                    <CardDescription>
                                        {automationReadiness.ready
                                            ? 'Employee profiles, managers, template limits, and My KPI weights are ready.'
                                            : 'Resolve every blocker before opening or synchronizing this cycle.'}
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant={automationReadiness.ready ? 'default' : 'outline'}
                                    className={automationReadiness.ready ? 'bg-emerald-600' : 'border-amber-300 text-amber-900 dark:text-amber-100'}
                                >
                                    {automationReadiness.ready ? 'Ready to open' : `${automationReadiness.blockers.length} blocker${automationReadiness.blockers.length === 1 ? '' : 's'}`}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6">
                            {canLaunchCycle ? (
                                <CycleLaunchPanel
                                    reviewCycle={reviewCycle}
                                    automationReadiness={automationReadiness}
                                    onLaunch={() => setOpenConfirmVisible(true)}
                                    onScrollToBlockers={scrollToBlockers}
                                />
                            ) : null}

                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                {(
                                    [
                                        { label: 'Eligible', value: automationReadiness.eligible, icon: Users, iconClass: 'text-sky-600' },
                                        { label: 'Excluded', value: automationReadiness.excluded, icon: UserMinus, iconClass: 'text-rose-600' },
                                        { label: 'Existing', value: automationReadiness.existing, icon: ClipboardList, iconClass: 'text-violet-600' },
                                        { label: 'New', value: automationReadiness.to_create, icon: UserPlus, iconClass: 'text-emerald-600' },
                                        { label: 'To prepare', value: automationReadiness.to_prepare, icon: RefreshCcw, iconClass: 'text-amber-600' },
                                        { label: 'Objectives', value: automationReadiness.objective_count, icon: Target, iconClass: 'text-orange-600' },
                                    ] satisfies Array<{
                                        label: string;
                                        value: number;
                                        icon: ComponentType<{ className?: string }>;
                                        iconClass: string;
                                    }>
                                ).map((metric) => {
                                    const Icon = metric.icon;

                                    return (
                                        <div key={metric.label} className="bg-background/80 rounded-lg border p-3 shadow-sm">
                                            <div className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wide uppercase">
                                                <Icon className={`size-3.5 shrink-0 ${metric.iconClass}`} />
                                                {metric.label}
                                            </div>
                                            <div className="text-foreground mt-1 text-xl font-semibold tabular-nums">{metric.value}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {automationReadiness.blockers.length > 0 ? (
                                <div id="automation-blockers">
                                    <AutomationReadinessBlockers
                                        blockers={automationReadiness.blockers}
                                        perspectiveOptions={perspectiveOptions}
                                        templateLimits={automationReadiness.template}
                                    />
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-12">
                    <Card className="shadow-sm lg:col-span-8">
                        <CardHeader className="bg-muted/20 border-b">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <CardTitle className="text-lg">Cycle Summary</CardTitle>
                                    <CardDescription>Core timeline, operational state, and narrative for this performance cycle.</CardDescription>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{reviewCycle.code}</Badge>
                                    <Badge variant={getStatusVariant(reviewCycle.status)}>{titleCase(reviewCycle.status)}</Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-8 p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="text-muted-foreground flex items-center gap-2">
                                        <CalendarDays className="h-4.5 w-4.5" />
                                        <span className="text-xs font-medium tracking-wide uppercase">Commencement</span>
                                    </div>
                                    <div className="text-foreground text-xl font-semibold">{formatDate(reviewCycle.start_date)}</div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-muted-foreground flex items-center gap-2">
                                        <CalendarDays className="h-4.5 w-4.5" />
                                        <span className="text-xs font-medium tracking-wide uppercase">Termination</span>
                                    </div>
                                    <div className="text-foreground text-xl font-semibold">{formatDate(reviewCycle.end_date)}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4.5 w-4.5" />
                                    <span className="text-xs font-medium tracking-wide uppercase">Executive Summary</span>
                                </div>

                                <div className="bg-muted/20 rounded-xl border p-4">
                                    <p className="text-muted-foreground text-sm leading-7">
                                        {reviewCycle.description?.trim() || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="bg-muted/20 rounded-lg border p-4">
                                    <div className="text-muted-foreground text-xs tracking-wide uppercase">Goal Setting</div>
                                    <div className="text-foreground mt-2 text-sm font-medium">{formatDate(reviewCycle.goal_setting_deadline)}</div>
                                </div>

                                <div className="bg-muted/20 rounded-lg border p-4">
                                    <div className="text-muted-foreground text-xs tracking-wide uppercase">Self Assessment</div>
                                    <div className="text-foreground mt-2 text-sm font-medium">{formatDate(reviewCycle.self_assessment_deadline)}</div>
                                </div>

                                <div className="bg-muted/20 rounded-lg border p-4">
                                    <div className="text-muted-foreground text-xs tracking-wide uppercase">Manager Review</div>
                                    <div className="text-foreground mt-2 text-sm font-medium">{formatDate(reviewCycle.manager_review_deadline)}</div>
                                </div>

                                <div className="bg-muted/20 rounded-lg border p-4">
                                    <div className="text-muted-foreground text-xs tracking-wide uppercase">Approval</div>
                                    <div className="text-foreground mt-2 text-sm font-medium">{formatDate(reviewCycle.approval_deadline)}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm lg:col-span-4">
                        <CardHeader className="bg-muted/20 border-b">
                            <div>
                                <CardTitle className="text-lg">Workflow Progress</CardTitle>
                                <CardDescription>Total assessments: {totalAssessments}</CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5 p-6">
                            {orderedStatuses.length > 0 ? (
                                orderedStatuses.map((status) => {
                                    const count = statusCounts[status] ?? 0;
                                    const percent = totalAssessments > 0 ? Math.round((count / totalAssessments) * 100) : 0;

                                    return (
                                        <div key={status} className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground font-medium tracking-wide uppercase">{titleCase(status)}</span>
                                                <span className="text-foreground font-semibold">
                                                    {count} <span className="text-muted-foreground font-normal">/ {percent}%</span>
                                                </span>
                                            </div>

                                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                <div className="bg-foreground h-full rounded-full" style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="bg-muted/20 text-muted-foreground rounded-xl border p-4 text-sm">
                                    No workflow counts available for this cycle yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <Target className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="text-foreground text-3xl font-bold tracking-tight">{activeCount}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Assessments currently somewhere in the active workflow.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <FolderKanban className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Template Options</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="text-foreground text-3xl font-bold tracking-tight">{templateOptions.length}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Available templates that can support assignments for this cycle.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <Clock3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Current State</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="text-foreground text-3xl font-bold tracking-tight capitalize">{normalizeStatus(reviewCycle.status)}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Operational state of this review cycle right now.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/20 border-b">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">Status Distribution</CardTitle>
                                <CardDescription>Current breakdown of assessment records by workflow state.</CardDescription>
                            </div>

                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                <Sparkles className="h-4 w-4" />
                                <span>Operational snapshot</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {orderedStatuses.length === 0 ? (
                            <div className="text-muted-foreground flex min-h-[220px] items-center justify-center p-6 text-sm">
                                No status data is available for this cycle.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted/30 text-left">
                                        <tr>
                                            <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                Workflow State
                                            </th>
                                            <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                Count
                                            </th>
                                            <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                Share
                                            </th>
                                            <th className="text-muted-foreground px-6 py-4 text-right text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {orderedStatuses.map((status, index) => {
                                            const count = statusCounts[status] ?? 0;
                                            const percent = totalAssessments > 0 ? Math.round((count / totalAssessments) * 100) : 0;

                                            return (
                                                <tr
                                                    key={status}
                                                    className={`hover:bg-muted/20 border-t transition-colors ${
                                                        index % 2 === 1 ? 'bg-muted/[0.03]' : ''
                                                    }`}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="text-foreground font-medium">{titleCase(status)}</div>
                                                    </td>

                                                    <td className="text-muted-foreground px-6 py-5">{count}</td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex min-w-[180px] items-center gap-3">
                                                            <span className="text-foreground w-10 text-sm font-medium">{percent}%</span>
                                                            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                                                                <div className="bg-foreground h-full rounded-full" style={{ width: `${percent}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end">
                                                            <Button variant="ghost" size="icon" type="button">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AssignEmployeesModal
                open={assignModalOpen}
                onOpenChange={setAssignModalOpen}
                reviewCycle={{ id: reviewCycle.id, name: reviewCycle.name }}
                employeeProfileOptions={employeeProfileOptions}
                templateOptions={templateOptions}
            />

            <AlertDialog open={openConfirmVisible} onOpenChange={setOpenConfirmVisible}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Open cycle and assign all eligible employees?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will open <span className="font-medium">{reviewCycle.name}</span>, prepare{' '}
                            {automationReadiness?.to_create ?? 0} new and {automationReadiness?.to_prepare ?? 0} existing appraisal(s) for{' '}
                            {automationReadiness?.eligible ?? 0} eligible employee{(automationReadiness?.eligible ?? 0) === 1 ? '' : 's'}, snapshot{' '}
                            {automationReadiness?.objective_count ?? 0} My KPI objective(s), and notify employees after the transaction succeeds.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.post(route('performance.review_cycles.open', reviewCycle.id))}>
                            Open & assign {automationReadiness?.eligible ?? 0} employees
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PerformancePage>
    );
}
