import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { GoalLibraryItem } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    CalendarDays,
    ClipboardList,
    FileText,
    Gauge,
    Layers3,
    PencilLine,
    ShieldCheck,
    Target,
} from 'lucide-react';

const breadcrumbs = (item: GoalLibraryItem): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Goal Library', href: route('performance.goal_library.index') },
    { title: item.title, href: route('performance.goal_library.show', item.id) },
];

export default function GoalLibraryShow({ goalLibraryItem }: { goalLibraryItem: GoalLibraryItem }) {
    return (
        <PerformancePage
            title={goalLibraryItem.title}
            description="Reusable SMART goal detail."
            breadcrumbs={breadcrumbs(goalLibraryItem)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.goal_library.edit', goalLibraryItem.id)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit Goal
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                SMART objective
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                    {goalLibraryItem.title}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Reusable SMART goal template designed for consistent planning, alignment, and
                                    measurement across departments and performance cycles.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Goal ID</div>
                                <div className="mt-1 font-semibold text-foreground">{goalLibraryItem.id}</div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                                <div className="mt-1 font-semibold text-foreground">
                                    {goalLibraryItem.is_active ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    <Card className="shadow-sm lg:col-span-8">
                        <CardHeader className="border-b bg-muted/20">
                            <div>
                                <CardTitle className="text-lg">Detailed Description</CardTitle>
                                <CardDescription>
                                    Full reusable goal narrative, target expectations, and evidence guidance.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-8 p-6">
                            <div>
                                <p className="text-sm leading-7 text-muted-foreground">
                                    {goalLibraryItem.description?.trim() || 'No description provided.'}
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Target className="h-4.5 w-4.5" />
                                        <h3 className="text-sm font-semibold text-foreground">Target Definition</h3>
                                    </div>

                                    <div className="rounded-xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                                        {goalLibraryItem.target_definition?.trim() || 'No target definition provided.'}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <FileText className="h-4.5 w-4.5" />
                                        <h3 className="text-sm font-semibold text-foreground">Evidence Source</h3>
                                    </div>

                                    <div className="rounded-xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                                        {goalLibraryItem.evidence_source?.trim() || 'No evidence source provided.'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 lg:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <CardTitle className="text-lg">Key Metrics</CardTitle>
                                <CardDescription>
                                    Primary measurement details for this reusable goal.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 p-6">
                                <div className="flex items-center justify-between gap-4 border-b pb-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Gauge className="h-4 w-4" />
                                        KPI / Measure
                                    </div>
                                    <div className="text-right text-sm font-medium text-foreground">
                                        {goalLibraryItem.kpi_measure || '-'}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 border-b pb-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ClipboardList className="h-4 w-4" />
                                        Default Weight
                                    </div>
                                    <div className="text-right text-sm font-medium text-foreground">
                                        {goalLibraryItem.default_weight ?? '-'}%
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarDays className="h-4 w-4" />
                                        Timeline
                                    </div>
                                    <div className="text-right text-sm font-medium text-foreground">
                                        {goalLibraryItem.timeline_days ?? '-'} days
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Performance Insight</CardTitle>
                                <CardDescription>
                                    Quick-read summary for strategic usage.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="rounded-xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                                    This library goal can be reused across aligned performance cycles and helps
                                    standardize measurable target-setting across teams.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Strategic Perspective</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-base font-semibold text-foreground">
                                {goalLibraryItem.perspective?.name ?? '-'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Department</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-base font-semibold text-foreground">
                                {goalLibraryItem.department?.name ?? '-'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Briefcase className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Job Title Alignment</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-base font-semibold text-foreground">
                                {goalLibraryItem.job_title?.name ?? '-'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <CardTitle className="text-lg">Goal Summary</CardTitle>
                        <CardDescription>
                            Consolidated view of the reusable goal definition and alignment profile.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border bg-muted/20 p-4">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Active State
                                </div>
                                <div className="mt-2 text-sm font-medium text-foreground">
                                    {goalLibraryItem.is_active ? 'Active and reusable' : 'Inactive'}
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/20 p-4">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Reusability
                                </div>
                                <div className="mt-2 text-sm font-medium text-foreground">
                                    Suitable for repeat planning and aligned goal assignment
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="text-sm leading-6 text-muted-foreground">
                            Use this library item when you need a consistent, measurable objective that can be assigned
                            across cycles while preserving strategic alignment and reporting clarity.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}