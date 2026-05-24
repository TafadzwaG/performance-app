import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { GoalLibraryItem, GoalLibraryScope, Option, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import { Briefcase, Building2, Filter, FolderKanban, PencilLine, Plus, Search, Target, View, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

interface Props {
    goalLibraryItems: Paginated<GoalLibraryItem>;
    filters: {
        search: string;
        department_id: string;
        job_title_id: string;
        perspective_id: string;
    };
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    perspectiveOptions: Option[];
    scope: GoalLibraryScope;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'My KPIs', href: route('performance.my_kpis.index') },
];

const selectClassName =
    'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function MyKpisIndex({ goalLibraryItems, filters, departmentOptions, jobTitleOptions, perspectiveOptions, scope }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [departmentId, setDepartmentId] = useState(filters.department_id ?? '');
    const [jobTitleId, setJobTitleId] = useState(filters.job_title_id ?? '');
    const [perspectiveId, setPerspectiveId] = useState(filters.perspective_id ?? '');

    const activeFilterCount = useMemo(
        () => [search, departmentId, jobTitleId, perspectiveId].filter(Boolean).length,
        [search, departmentId, jobTitleId, perspectiveId],
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('performance.my_kpis.index'),
            {
                search,
                department_id: departmentId || undefined,
                job_title_id: jobTitleId || undefined,
                perspective_id: perspectiveId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setDepartmentId('');
        setJobTitleId('');
        setPerspectiveId('');

        router.get(route('performance.my_kpis.index'), {}, { preserveState: true, replace: true });
    };

    const totalCount = goalLibraryItems.total ?? goalLibraryItems.data.length;
    const from = goalLibraryItems.from ?? 0;
    const to = goalLibraryItems.to ?? goalLibraryItems.data.length;

    return (
        <PerformancePage
            title="My KPIs"
            description="Goals aligned to your department and job title."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Your KPI catalog
                            </Badge>

                            <div>
                                <h1 className="text-foreground text-3xl font-bold tracking-tight">My KPIs</h1>
                                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                                    Goals assigned to {scope.department_label ?? 'your department'} for the{' '}
                                    {scope.job_title_label ?? 'your job title'} role.
                                </p>
                            </div>

                            <Button asChild>
                                <Link href={route('performance.my_kpis.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add KPI
                                </Link>
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground text-xs tracking-wide uppercase">Total KPIs</div>
                                <div className="text-foreground mt-1 font-semibold">{totalCount}</div>
                            </div>

                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wide uppercase">
                                    <Building2 className="h-3.5 w-3.5" />
                                    Department
                                </div>
                                <div className="text-foreground mt-1 font-semibold">{scope.department_label ?? '—'}</div>
                            </div>

                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wide uppercase">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    Job title
                                </div>
                                <div className="text-foreground mt-1 font-semibold">{scope.job_title_label ?? '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/20 border-b">
                        <CardTitle className="text-lg">Search KPIs</CardTitle>
                        <CardDescription>Find goals by title, KPI measure, or strategic perspective.</CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-4">
                            <div className={`grid gap-4 lg:grid-cols-2 ${scope.locked ? 'xl:grid-cols-2' : 'xl:grid-cols-4'}`}>
                                <div className="space-y-2">
                                    <label className="font-mono-brand text-muted-foreground block text-[10px] tracking-[0.22em] uppercase">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search title or KPI measure"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                {!scope.locked ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="font-mono-brand text-muted-foreground block text-[10px] tracking-[0.22em] uppercase">
                                                Department
                                            </label>
                                            <select
                                                className={selectClassName}
                                                value={departmentId}
                                                onChange={(event) => setDepartmentId(event.target.value)}
                                            >
                                                <option value="">All departments</option>
                                                {departmentOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="font-mono-brand text-muted-foreground block text-[10px] tracking-[0.22em] uppercase">
                                                Job Title
                                            </label>
                                            <select
                                                className={selectClassName}
                                                value={jobTitleId}
                                                onChange={(event) => setJobTitleId(event.target.value)}
                                            >
                                                <option value="">All job titles</option>
                                                {jobTitleOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                ) : null}

                                <div className="space-y-2">
                                    <label className="font-mono-brand text-muted-foreground block text-[10px] tracking-[0.22em] uppercase">
                                        Perspective
                                    </label>
                                    <select
                                        className={selectClassName}
                                        value={perspectiveId}
                                        onChange={(event) => setPerspectiveId(event.target.value)}
                                    >
                                        <option value="">All perspectives</option>
                                        {perspectiveOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Apply Filters
                                </Button>

                                {activeFilterCount > 0 ? (
                                    <Button type="button" variant="ghost" onClick={clearFilters}>
                                        <X className="mr-2 h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                ) : null}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/20 border-b">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Your goals</CardTitle>
                                <CardDescription>KPI templates you can use when planning appraisals.</CardDescription>
                            </div>

                            <div className="text-muted-foreground text-xs">
                                Showing {from} to {to} of {totalCount}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {goalLibraryItems.data.length === 0 ? (
                            <div className="flex min-h-[280px] items-center justify-center p-6">
                                <div className="space-y-2 text-center">
                                    <div className="bg-muted/30 mx-auto flex h-12 w-12 items-center justify-center rounded-full border">
                                        <FolderKanban className="text-muted-foreground h-5 w-5" />
                                    </div>
                                    <h3 className="text-foreground text-base font-semibold">No KPIs found</h3>
                                    <p className="text-muted-foreground text-sm">
                                        No goals are configured for your department and job title yet.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-muted/30 text-left">
                                            <tr>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Perspective
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Objective (The Goal)
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    KPI / Measure (How Measured)
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Target (Success Definition)
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-right text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Weight
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Evidence Source
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-right text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Details
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {goalLibraryItems.data.map((item) => (
                                                <tr key={item.id} className="hover:bg-muted/20 border-t transition-colors">
                                                    <td className="px-6 py-5">
                                                        <Badge variant="secondary">{item.perspective?.name ?? '-'}</Badge>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex min-w-[240px] items-start gap-3">
                                                            <div className="bg-muted/30 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border">
                                                                <Target className="text-muted-foreground h-4 w-4" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="text-foreground font-medium">{item.title}</div>
                                                                {item.description ? (
                                                                    <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                                                                        {item.description}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="text-muted-foreground px-6 py-5">{item.kpi_measure ?? '-'}</td>

                                                    <td className="text-muted-foreground px-6 py-5">{item.target_definition ?? '-'}</td>

                                                    <td className="text-muted-foreground px-6 py-5 text-right">
                                                        {item.default_weight ?? '-'}%
                                                    </td>

                                                    <td className="text-muted-foreground px-6 py-5">{item.evidence_source ?? '-'}</td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end gap-2">
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link href={route('performance.goal_library.show', item.id)}>
                                                                    <View className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>
                                                            <Button asChild size="sm">
                                                                <Link href={route('performance.my_kpis.edit', item.id)}>
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

                                <div className="bg-muted/10 border-t px-6 py-4">
                                    <PaginationLinks paginated={goalLibraryItems} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
