import PerformancePage from '@/components/performance/PerformancePage';
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
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    BarChart3,
    Building2,
    CheckCircle2,
    Clock3,
    Download,
    FileSpreadsheet,
    FolderKanban,
    Layers3,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Reports', href: route('performance.reports.index') },
];

type ReportItem = {
    title: string;
    routeName: string;
    description: string;
    icon: LucideIcon;
    tag: string;
};

const reportLinks: ReportItem[] = [
    {
        title: 'Cycle Summary',
        routeName: 'performance.reports.cycle_summary',
        description: 'High-level overview of active and historical review cycles across the organization.',
        icon: Layers3,
        tag: 'Cycle analytics',
    },
    {
        title: 'Department Summary',
        routeName: 'performance.reports.department_summary',
        description: 'Performance breakdown by department, leadership units, and business functions.',
        icon: Building2,
        tag: 'Department view',
    },
    {
        title: 'Employee Summary',
        routeName: 'performance.reports.employee_summary',
        description: 'Individual performance history, scoring trends, and progress visibility.',
        icon: UserRound,
        tag: 'Employee insights',
    },
    {
        title: 'Completion Status',
        routeName: 'performance.reports.completion_status',
        description: 'Track submission progress, pending actions, and review completion rates.',
        icon: CheckCircle2,
        tag: 'Workflow status',
    },
    {
        title: 'Rating Distribution',
        routeName: 'performance.reports.rating_distribution',
        description: 'Review rating spread, calibration patterns, and score distribution trends.',
        icon: BarChart3,
        tag: 'Ratings analysis',
    },
    {
        title: 'Overdue Reviews',
        routeName: 'performance.reports.overdue_reviews',
        description: 'Identify missed deadlines, delayed reviewer actions, and outstanding appraisals.',
        icon: Clock3,
        tag: 'Escalation focus',
    },
];

type PendingAction =
    | {
          type: 'generate' | 'download';
          report: ReportItem;
      }
    | null;

export default function ReportsIndex({ reviewCycleOptions }: { reviewCycleOptions: Option[] }) {
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    const totalReports = reportLinks.length;
    const totalFilters = reviewCycleOptions.length;

    const dialogTitle = useMemo(() => {
        if (!pendingAction) return '';

        if (pendingAction.type === 'generate') {
            return `Generate ${pendingAction.report.title}?`;
        }

        return `Download ${pendingAction.report.title}?`;
    }, [pendingAction]);

    const dialogDescription = useMemo(() => {
        if (!pendingAction) return '';

        if (pendingAction.type === 'generate') {
            return `You are about to open ${pendingAction.report.title} and continue with report generation. This keeps your existing reporting flow unchanged.`;
        }

        return `You are about to open ${pendingAction.report.title} and continue with download or export actions from the report page.`;
    }, [pendingAction]);

    const handleConfirm = () => {
        if (!pendingAction) return;

        router.get(route(pendingAction.report.routeName));
        setPendingAction(null);
    };

    return (
        <PerformancePage
            title="Reports"
            description="Open performance reports and export cycle data."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Reporting workspace
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Open performance reports, review cycle summaries, and department-level analytics in
                                    a clean reporting workspace.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Reports</div>
                                <div className="mt-1 font-semibold text-foreground">{totalReports}</div>
                            </div>
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Cycle filters</div>
                                <div className="mt-1 font-semibold text-foreground">{totalFilters}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl">Available Reports</CardTitle>
                            <CardDescription>
                                Open a report directly, or confirm generation and download actions from here.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {reportLinks.map((report) => {
                                    const Icon = report.icon;

                                    return (
                                        <Card
                                            key={report.title}
                                            className="group border-border/60 shadow-none transition-colors hover:bg-muted/20"
                                        >
                                            <CardHeader className="space-y-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40">
                                                        <Icon className="h-5 w-5 text-foreground" />
                                                    </div>
                                                    <Badge variant="outline">{report.tag}</Badge>
                                                </div>

                                                <div className="space-y-1">
                                                    <CardTitle className="text-base">{report.title}</CardTitle>
                                                    <CardDescription className="text-sm leading-6">
                                                        {report.description}
                                                    </CardDescription>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                                                    <span className="text-muted-foreground">Review cycle filters</span>
                                                    <span className="font-medium text-foreground">
                                                        {reviewCycleOptions.length}
                                                    </span>
                                                </div>

                                                <Separator />

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button asChild variant="default" size="sm">
                                                        <Link href={route(report.routeName)}>
                                                            Open report
                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Link>
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setPendingAction({
                                                                type: 'generate',
                                                                report,
                                                            })
                                                        }
                                                    >
                                                        <Sparkles className="mr-2 h-4 w-4" />
                                                        Generate
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setPendingAction({
                                                                type: 'download',
                                                                report,
                                                            })
                                                        }
                                                    >
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Report Center</CardTitle>
                                <CardDescription>
                                    A quick overview of your reporting workspace and cycle coverage.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                        <FileSpreadsheet className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Structured report outputs</p>
                                        <p className="text-xs text-muted-foreground">
                                            Open summary, status, and distribution reports.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                        <FolderKanban className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Reusable cycle filters</p>
                                        <p className="text-xs text-muted-foreground">
                                            {reviewCycleOptions.length} filter options are available for report views.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Monitored outcomes</p>
                                        <p className="text-xs text-muted-foreground">
                                            Track completion, ratings, overdue items, and summary analytics.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Notes</CardTitle>
                                <CardDescription>
                                    Use the direct link to open a report immediately, or confirm generation and
                                    download actions before continuing.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Open report keeps your current route behavior intact.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Generate and Download both prompt with an alert dialog before proceeding.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <AlertDialog
                    open={!!pendingAction}
                    onOpenChange={(open) => {
                        if (!open) setPendingAction(null);
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirm}>
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PerformancePage>
    );
}