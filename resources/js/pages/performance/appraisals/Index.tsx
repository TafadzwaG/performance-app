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
    filters: { search: string; status: string; needs_action?: boolean };
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
            { search, status, needs_action: filters.needs_action ? 1 : undefined },
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
                <header className="bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm lg:p-8">
                    <div className="bg-brand-sand/12 absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <div className="font-mono-brand text-foreground/60 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                                <span className="bg-brand-sand inline-block h-px w-8" />
                                <span>§ Review operations</span>
                            </div>
                            <div>
                                <h1 className="font-display text-balance text-foreground text-4xl leading-[1] font-light tracking-tight lg:text-5xl">
                                    Appraisals
                                </h1>
                                <p className="text-foreground/65 mt-3 max-w-2xl text-[14px] leading-relaxed">
                                    Track appraisal records across planning, review, approval, and completion with a
                                    clean operational overview.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3">
                                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                    Total records
                                </div>
                                <div className="font-display text-foreground mt-1 text-2xl leading-none font-light">
                                    {totalCount}
                                </div>
                            </div>
                            <div className="rounded-xl border bg-muted/30 px-4 py-3">
                                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                    Visible now
                                </div>
                                <div className="font-display text-foreground mt-1 text-2xl leading-none font-light">
                                    {totalVisible}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                <ClipboardList className="h-3.5 w-3.5" />
                                Active Appraisals
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-foreground text-4xl leading-none font-light tracking-tight">{totalVisible}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Records currently shown in the filtered result set.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Completed
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-foreground text-4xl leading-none font-light tracking-tight">{completedCount}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Calibrating or finalized appraisals in the visible list.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                <Trophy className="h-3.5 w-3.5" />
                                Scored Records
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-foreground text-4xl leading-none font-light tracking-tight">{scoredCount}</div>
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
                                <label className="font-mono-brand text-muted-foreground mb-2 block text-[10px] tracking-[0.22em] uppercase">
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
                                <label className="font-mono-brand text-muted-foreground mb-2 block text-[10px] tracking-[0.22em] uppercase">
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
                                    <h3 className="font-display text-foreground text-xl font-light tracking-tight">
                                        No appraisals found
                                    </h3>
                                    <p className="text-muted-foreground text-[13px]">
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
                                                <th className="px-6 py-4 font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                    Employee
                                                </th>
                                                <th className="px-6 py-4 font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                    Cycle
                                                </th>
                                                <th className="px-6 py-4 font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                    Template
                                                </th>
                                                <th className="px-6 py-4 font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                    Overall
                                                </th>
                                                <th className="px-6 py-4 text-right font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
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
