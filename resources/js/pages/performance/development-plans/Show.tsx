import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Option } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    FileText,
    PencilLine,
    Target,
    UserRound,
} from 'lucide-react';

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Development Plans', href: route('performance.development_plans.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.development_plans.show', appraisal.id) },
];

function getStatusBadgeVariant(status?: string | null) {
    const normalized = (status ?? 'pending').toLowerCase();

    if (normalized === 'completed') return 'default';
    if (normalized === 'in_progress') return 'secondary';
    return 'outline';
}

function formatStatus(status?: string | null) {
    return (status ?? 'pending').replaceAll('_', ' ');
}

export default function DevelopmentPlanShow({
    appraisal,
    userOptions,
}: {
    appraisal: Appraisal;
    userOptions: Option[];
}) {
    void userOptions;

    const plan = appraisal.development_plan;
    const actions = plan?.actions ?? [];

    return (
        <PerformancePage
            title="Development Plan"
            description="View agreed development actions and follow-up status."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.development_plans.edit', appraisal.id)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit Plan
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Development planning
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Development Plan
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    View agreed development actions, strengths, improvement areas, and follow-up
                                    notes for this employee plan.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Employee</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {appraisal.employee_name_snapshot}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Cycle</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {appraisal.cycle_name_snapshot}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Actions</div>
                                <div className="mt-1 font-semibold text-foreground">{actions.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Strengths</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {plan?.strengths?.trim() || 'Not captured'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Improvement Areas</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {plan?.improvement_areas?.trim() || 'Not captured'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Follow-up Notes</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {plan?.follow_up_notes?.trim() || 'Not captured'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Development Actions</CardTitle>
                                <CardDescription>
                                    Agreed actions, owners, timelines, and follow-up status for this plan.
                                </CardDescription>
                            </div>

                            <Badge variant="outline">{actions.length} action item(s)</Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 p-6">
                        {actions.length === 0 ? (
                            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed bg-muted/10 p-6">
                                <div className="space-y-2 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                                        <ClipboardList className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground">No actions recorded</h3>
                                    <p className="max-w-sm text-sm text-muted-foreground">
                                        This development plan does not yet have any follow-up action items.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            actions.map((action, index) => (
                                <Card key={`plan-action-${index}`} className="shadow-none">
                                    <CardHeader className="border-b bg-muted/10 pb-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">Action {index + 1}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Development step
                                                </span>
                                            </div>

                                            <Badge variant={getStatusBadgeVariant(action.status)}>
                                                {formatStatus(action.status)}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-5 p-6">
                                        <div className="grid gap-4 xl:grid-cols-12">
                                            <div className="space-y-2 xl:col-span-5">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Action Item
                                                </div>
                                                <div className="rounded-lg border bg-background px-4 py-3">
                                                    <div className="font-medium text-foreground">
                                                        {action.action || 'Not specified'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 xl:col-span-3">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Owner
                                                </div>
                                                <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-3">
                                                    <UserRound className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">
                                                        {action.owner?.name ?? 'No owner'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 xl:col-span-2">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Due Date
                                                </div>
                                                <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-3">
                                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">
                                                        {formatDate(action.due_date, 'No due date')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 xl:col-span-2">
                                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                    Status
                                                </div>
                                                <div className="rounded-lg border bg-background px-4 py-3">
                                                    <span className="text-sm text-foreground">
                                                        {formatStatus(action.status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Follow-up Status Notes
                                            </div>
                                            <div className="rounded-lg border bg-muted/20 px-4 py-4 text-sm leading-6 text-muted-foreground">
                                                {action.follow_up_status?.trim() || 'No follow-up notes recorded.'}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
