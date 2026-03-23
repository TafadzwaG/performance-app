import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Paginated } from '@/types/performance';
import { Link } from '@inertiajs/react';
import { ArrowRight, ClipboardList, Eye, FileText, PencilLine, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Development Plans', href: route('performance.development_plans.index') },
];

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export default function DevelopmentPlansIndex({ plans }: { plans: Paginated<Appraisal> }) {
    const visiblePlans = plans.data.length;
    const uniqueCycles = new Set(plans.data.map((plan) => plan.cycle_name_snapshot).filter(Boolean)).size;
    const uniqueEmployees = new Set(plans.data.map((plan) => plan.employee_name_snapshot).filter(Boolean)).size;

    const from = plans.from ?? 0;
    const to = plans.to ?? visiblePlans;
    const total = plans.total ?? visiblePlans;

    return (
        <PerformancePage
            title="Development Plans"
            description="Track strengths, improvement areas, and follow-up actions."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Talent development
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Development Plans
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Review employee development plans, follow-up actions, and cycle-linked growth
                                    records in a structured workspace.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{total} total plan records</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ClipboardList className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Visible Plans</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{visiblePlans}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Plan entries currently shown on this page.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Employees</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{uniqueEmployees}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Unique employees represented in the visible plans.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ArrowRight className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Review Cycles</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{uniqueCycles}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Distinct cycle snapshots in the current result set.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Plan Directory</CardTitle>
                                <CardDescription>
                                    Employee development plans grouped by cycle snapshot and available actions.
                                </CardDescription>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Showing {from} to {to} of {total} entries
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {plans.data.length === 0 ? (
                            <div className="flex min-h-[280px] items-center justify-center p-6">
                                <div className="space-y-2 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                                        <ClipboardList className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">
                                        No development plans found
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        There are no plan records available for this view.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-muted/30 text-left">
                                            <tr>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Employee
                                                </th>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Cycle
                                                </th>
                                                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {plans.data.map((plan) => (
                                                <tr
                                                    key={plan.id}
                                                    className="border-t transition-colors hover:bg-muted/20"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/30 text-sm font-semibold text-foreground">
                                                                {getInitials(plan.employee_name_snapshot ?? '')}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="truncate font-medium text-foreground">
                                                                    {plan.employee_name_snapshot}
                                                                </div>
                                                                <div className="truncate text-xs text-muted-foreground">
                                                                    Development plan record
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <Badge variant="outline" className="font-normal">
                                                            {plan.cycle_name_snapshot}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end gap-2">
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link href={route('performance.development_plans.show', plan.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>

                                                            <Button asChild variant="secondary" size="sm">
                                                                <Link href={route('performance.development_plans.edit', plan.id)}>
                                                                    <PencilLine className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border-t bg-muted/10 px-6 py-4">
                                    <PaginationLinks paginated={plans} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}