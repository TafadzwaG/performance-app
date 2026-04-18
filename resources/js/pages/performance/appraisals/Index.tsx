import AppraisalStatusBadge from '@/components/performance/AppraisalStatusBadge';
import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
    CheckCircle2,
    ClipboardList,
    Filter,
    Plus,
    Search,
    SlidersHorizontal,
    Trophy,
} from 'lucide-react';

interface Props {
    appraisals: Paginated<Appraisal>;
    filters: { search: string; status: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: '/performance/appraisals' },
];

function getInitials(name?: string | null) {
    return (name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export default function AppraisalsIndex({ appraisals, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('performance.appraisals.index'),
            { search, status },
            { preserveState: true, replace: true },
        );
    };

    const totalVisible = appraisals.data.length;
    const totalCount = appraisals.total ?? totalVisible;
    const completedCount = useMemo(
        () =>
            appraisals.data.filter((item) =>
                ['calibration_pending', 'finalized'].includes((item.status ?? '').toLowerCase()),
            ).length,
        [appraisals.data],
    );
    const scoredCount = useMemo(
        () => appraisals.data.filter((item) => item.overall_score !== null && item.overall_score !== undefined).length,
        [appraisals.data],
    );

    const from = appraisals.from ?? 0;
    const to = appraisals.to ?? totalVisible;

    return (
        <PerformancePage
            title="Appraisals"
            description="Track cycle appraisals across planning, review, approval, and finalization."
            breadcrumbs={breadcrumbs}
            primaryAction={
                can.create
                    ? {
                          label: 'Create Appraisal',
                          href: route('performance.appraisals.create'),
                          icon: <Plus className="h-4 w-4" />,
                      }
                    : undefined
            }
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Review operations
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Appraisals</h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Track appraisal records across planning, review, approval, and completion with a
                                    clean operational overview.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Total records
                                </div>
                                <div className="mt-1 font-semibold text-foreground">{totalCount}</div>
                            </div>
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Visible now</div>
                                <div className="mt-1 font-semibold text-foreground">{totalVisible}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ClipboardList className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Active Appraisals</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{totalVisible}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Records currently shown in the filtered result set.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{completedCount}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Calibrating or finalized appraisals in the visible list.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Trophy className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Scored Records</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{scoredCount}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Appraisals with an available overall score.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Filters</CardTitle>
                                <CardDescription>
                                    Search appraisals and narrow results by workflow status.
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>Live filter controls</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={submit} className="flex flex-col gap-3 lg:flex-row lg:items-end">
                            <div className="w-full lg:max-w-sm">
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search appraisals"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="w-full lg:max-w-xs">
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Status
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                >
                                    <option value="">All statuses</option>
                                    <option value="draft">Draft</option>
                                    <option value="goal_setting">Goal setting</option>
                                    <option value="self_assessment_pending">Self assessment pending</option>
                                    <option value="manager_review_pending">Manager review pending</option>
                                    <option value="approval_pending">Approval pending</option>
                                    <option value="calibration_pending">Calibration pending</option>
                                    <option value="finalized">Finalized</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Appraisal Directory</CardTitle>
                                <CardDescription>
                                    Review employee, cycle, template, status, and score details.
                                </CardDescription>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Showing {from} to {to} of {totalCount}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {appraisals.data.length === 0 ? (
                            <div className="flex min-h-[280px] items-center justify-center p-6">
                                <div className="space-y-2 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                                        <ClipboardList className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">No appraisals found</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Adjust your search or status filter to see matching appraisal records.
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
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Template
                                                </th>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Overall
                                                </th>
                                                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {appraisals.data.map((appraisal) => (
                                                <tr
                                                    key={appraisal.id}
                                                    className="border-t transition-colors hover:bg-muted/20"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted/30 text-xs font-semibold text-foreground">
                                                                {getInitials(appraisal.employee_name_snapshot)}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="truncate font-medium text-foreground">
                                                                    {appraisal.employee_name_snapshot}
                                                                </div>
                                                                <div className="truncate text-xs text-muted-foreground">
                                                                    {appraisal.employee_number_snapshot}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5 text-muted-foreground">
                                                        {appraisal.cycle_name_snapshot}
                                                    </td>

                                                    <td className="px-6 py-5 text-muted-foreground">
                                                        {appraisal.template_name_snapshot}
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <AppraisalStatusBadge status={appraisal.status} />
                                                    </td>

                                                    <td className="px-6 py-5 font-medium text-foreground">
                                                        {appraisal.overall_score ?? '-'}
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end">
                                                            <Button asChild size="sm" variant="outline">
                                                                <Link href={route('performance.appraisals.show', appraisal.id)}>
                                                                    Open
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
                                    <PaginationLinks paginated={appraisals} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
