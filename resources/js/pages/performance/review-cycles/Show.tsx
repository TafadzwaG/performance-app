import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { Option, ReviewCycle } from '@/types/performance';
import { router, Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Edit,
    Eye,
    FileText,
    FolderKanban,
    PlayCircle,
    Sparkles,
    Target,
    Users,
    XCircle,
} from 'lucide-react';

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

function formatDate(value?: string | null) {
    return value || 'Not set';
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

export default function ReviewCycleShow({ reviewCycle, statusCounts, templateOptions }: Props) {
    const orderedStatuses = getPhaseOrder(statusCounts);
    const totalAssessments = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

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

                    <Button asChild variant="outline">
                        <Link href={route('performance.review_cycles.assign', reviewCycle.id)}>
                            <Users className="mr-2 h-4 w-4" />
                            Assign Employees
                        </Link>
                    </Button>

                    {reviewCycle.status !== 'open' ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.post(route('performance.review_cycles.open', reviewCycle.id))}
                        >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Open Cycle
                        </Button>
                    ) : null}

                    {reviewCycle.status !== 'closed' ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.post(route('performance.review_cycles.close', reviewCycle.id))}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Close Cycle
                        </Button>
                    ) : null}
                </>
            }
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Review cycle workspace
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                    {reviewCycle.name}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Cycle details, status counts, and assignment actions.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Code</div>
                                <div className="mt-1 font-semibold text-foreground">{reviewCycle.code}</div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                                <div className="mt-1">
                                    <Badge variant={getStatusVariant(reviewCycle.status)}>
                                        {titleCase(reviewCycle.status)}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    <Card className="shadow-sm lg:col-span-8">
                        <CardHeader className="border-b bg-muted/20">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <CardTitle className="text-lg">Cycle Summary</CardTitle>
                                    <CardDescription>
                                        Core timeline, operational state, and narrative for this performance cycle.
                                    </CardDescription>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{reviewCycle.code}</Badge>
                                    <Badge variant={getStatusVariant(reviewCycle.status)}>
                                        {titleCase(reviewCycle.status)}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-8 p-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarDays className="h-4.5 w-4.5" />
                                        <span className="text-xs font-medium uppercase tracking-wide">
                                            Commencement
                                        </span>
                                    </div>
                                    <div className="text-xl font-semibold text-foreground">
                                        {formatDate(reviewCycle.start_date)}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarDays className="h-4.5 w-4.5" />
                                        <span className="text-xs font-medium uppercase tracking-wide">
                                            Termination
                                        </span>
                                    </div>
                                    <div className="text-xl font-semibold text-foreground">
                                        {formatDate(reviewCycle.end_date)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="h-4.5 w-4.5" />
                                    <span className="text-xs font-medium uppercase tracking-wide">
                                        Executive Summary
                                    </span>
                                </div>

                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <p className="text-sm leading-7 text-muted-foreground">
                                        {reviewCycle.description?.trim() || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Goal Setting
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {formatDate(reviewCycle.goal_setting_deadline)}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Self Assessment
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {formatDate(reviewCycle.self_assessment_deadline)}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Manager Review
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {formatDate(reviewCycle.manager_review_deadline)}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Approval
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {formatDate(reviewCycle.approval_deadline)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm lg:col-span-4">
                        <CardHeader className="border-b bg-muted/20">
                            <div>
                                <CardTitle className="text-lg">Workflow Progress</CardTitle>
                                <CardDescription>
                                    Total assessments: {totalAssessments}
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5 p-6">
                            {orderedStatuses.length > 0 ? (
                                orderedStatuses.map((status) => {
                                    const count = statusCounts[status] ?? 0;
                                    const percent =
                                        totalAssessments > 0 ? Math.round((count / totalAssessments) * 100) : 0;

                                    return (
                                        <div key={status} className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium uppercase tracking-wide text-muted-foreground">
                                                    {titleCase(status)}
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {count}{' '}
                                                    <span className="font-normal text-muted-foreground">
                                                        / {percent}%
                                                    </span>
                                                </span>
                                            </div>

                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-foreground"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                                    No workflow counts available for this cycle yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Active Assessments</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight text-foreground">{activeCount}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Assessments currently somewhere in the active workflow.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <FolderKanban className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Template Options</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight text-foreground">
                                {templateOptions.length}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Available templates that can support assignments for this cycle.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Current State</CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight text-foreground capitalize">
                                {normalizeStatus(reviewCycle.status)}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Operational state of this review cycle right now.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">Status Distribution</CardTitle>
                                <CardDescription>
                                    Current breakdown of assessment records by workflow state.
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Sparkles className="h-4 w-4" />
                                <span>Operational snapshot</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {orderedStatuses.length === 0 ? (
                            <div className="flex min-h-[220px] items-center justify-center p-6 text-sm text-muted-foreground">
                                No status data is available for this cycle.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-muted/30 text-left">
                                        <tr>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                Workflow State
                                            </th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                Count
                                            </th>
                                            <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                Share
                                            </th>
                                            <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {orderedStatuses.map((status, index) => {
                                            const count = statusCounts[status] ?? 0;
                                            const percent =
                                                totalAssessments > 0 ? Math.round((count / totalAssessments) * 100) : 0;

                                            return (
                                                <tr
                                                    key={status}
                                                    className={`border-t transition-colors hover:bg-muted/20 ${
                                                        index % 2 === 1 ? 'bg-muted/[0.03]' : ''
                                                    }`}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="font-medium text-foreground">
                                                            {titleCase(status)}
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5 text-muted-foreground">{count}</td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex min-w-[180px] items-center gap-3">
                                                            <span className="w-10 text-sm font-medium text-foreground">
                                                                {percent}%
                                                            </span>
                                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                                <div
                                                                    className="h-full rounded-full bg-foreground"
                                                                    style={{ width: `${percent}%` }}
                                                                />
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
        </PerformancePage>
    );
}

