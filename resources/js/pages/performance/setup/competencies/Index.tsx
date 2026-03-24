import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Competency, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Eye,
    Filter,
    Gauge,
    Network,
    PencilLine,
    Plus,
    Search,
    ShieldAlert,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

interface Props {
    competencies: Paginated<Competency>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Competencies', href: route('performance.setup.competencies.index') },
];

function normalizeCategory(category?: string | null) {
    if (!category) return 'Unclassified';
    return category.charAt(0).toUpperCase() + category.slice(1);
}

function buildCategoryDistribution(items: Competency[]) {
    const counts = items.reduce<Record<string, number>>((acc, item) => {
        const key = normalizeCategory(item.category);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

export default function CompetenciesIndex({ competencies, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.setup.competencies.index'), { search }, { preserveState: true, replace: true });
    };

    const totalOnPage = competencies.data.length;
    const totalResults = competencies.total ?? totalOnPage;
    const from = competencies.from ?? 0;
    const to = competencies.to ?? totalOnPage;
    const activeCount = competencies.data.filter((competency) => competency.is_active).length;
    const contextualCount = competencies.data.filter((competency) => competency.department || competency.job_title).length;
    const distribution = useMemo(() => buildCategoryDistribution(competencies.data), [competencies.data]);
    const maxDistribution = Math.max(...distribution.map(([, count]) => count), 1);

    return (
        <PerformancePage
            title="Competencies"
            description="Maintain competency, value, and behaviour definitions used across templates and manager reviews."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Competencies Index</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage behavioural and values-based catalogue entries used in appraisal scoring.
                            </p>
                        </div>

                        {can.create ? (
                            <Button asChild>
                                <Link href={route('performance.setup.competencies.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Competency
                                </Link>
                            </Button>
                        ) : null}
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="shadow-sm">
                            <CardContent className="flex h-32 flex-col justify-between p-6">
                                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Competencies On This Page
                                </span>

                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">{totalOnPage}</span>
                                    <span className="text-xs text-muted-foreground">Entries</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardContent className="flex h-32 flex-col justify-between p-6">
                                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Active Catalogue
                                </span>

                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">{activeCount}</span>
                                    <Badge variant="secondary">
                                        {totalOnPage > 0 ? `${Math.round((activeCount / totalOnPage) * 100)}% live` : '0% live'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden shadow-sm">
                            <CardContent className="flex h-32 flex-col justify-between p-6">
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <Gauge className="h-24 w-24" />
                                </div>

                                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Scoped Entries
                                </span>

                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">{contextualCount}</span>
                                    <span className="text-xs text-muted-foreground">Department or role linked</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="overflow-hidden shadow-sm">
                    <div className="flex flex-col gap-4 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex w-full flex-col gap-3 md:w-1/2 md:flex-row">
                            <form onSubmit={submit} className="flex w-full gap-2">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Filter by name, code, category or scope..."
                                        className="pl-9"
                                    />
                                </div>

                                <Button type="submit" variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filters
                                </Button>
                            </form>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                                Showing {from}-{to} of {totalResults}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-muted/30">
                                    <th className="px-6 py-4 text-left text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        Competency
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        Category
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        Scope
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {competencies.data.length > 0 ? (
                                    competencies.data.map((competency) => (
                                        <tr key={competency.id} className="group transition-colors hover:bg-muted/20">
                                            <td className="px-6 py-5">
                                                <div className="font-semibold text-foreground">{competency.name}</div>
                                                <div className="mt-0.5 text-xs text-muted-foreground">
                                                    <span className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] font-medium text-muted-foreground">
                                                        {competency.code}
                                                    </span>
                                                    <span className="ml-2">
                                                        {competency.description ?? 'No description'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <Badge variant="outline">{normalizeCategory(competency.category)}</Badge>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                    <div>{competency.department?.name ?? 'All departments'}</div>
                                                    <div>{competency.job_title?.name ?? 'All job titles'}</div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <Badge variant={competency.is_active ? 'secondary' : 'outline'}>
                                                    {competency.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={route('performance.setup.competencies.show', competency.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>

                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={route('performance.setup.competencies.edit', competency.id)}>
                                                            <PencilLine className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-sm text-muted-foreground">
                                            No competencies found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-4 border-t bg-muted/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-xs font-medium text-muted-foreground">
                            Showing {from} to {to} of {totalResults} competencies
                        </div>

                        <PaginationLinks paginated={competencies} />
                    </div>
                </Card>

                <div className="grid gap-8 lg:grid-cols-2">
                    <Card className="relative overflow-hidden border shadow-sm">
                        <CardContent className="p-8">
                            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-muted/40 blur-3xl" />

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold tracking-tight text-foreground">Behaviour Coverage</h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Use scoped competency entries where a value only applies to a specific department or
                                    role. Keep broadly applicable behavioural definitions generic to avoid duplicate
                                    catalogue maintenance.
                                </p>

                                <Button variant="outline" className="mt-6">
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Review Scoped Entries
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl tracking-tight">Category Distribution</CardTitle>
                            <CardDescription>
                                Top visible competency groups by category on this page.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {distribution.length > 0 ? (
                                <>
                                    <div className="mt-2 flex h-24 items-end gap-2">
                                        {distribution.map(([label, count]) => (
                                            <div key={label} className="flex flex-1 flex-col items-center justify-end gap-2">
                                                <div
                                                    className="w-full rounded-t-sm bg-foreground/80"
                                                    style={{ height: `${Math.max((count / maxDistribution) * 100, 12)}%` }}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 flex justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        {distribution.map(([label]) => (
                                            <span key={label} className="flex-1 text-center">
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-lg border bg-muted/20 p-6 text-sm text-muted-foreground">
                                    No distribution data available.
                                </div>
                            )}

                            <div className="mt-6 flex items-center gap-3 rounded-lg border bg-muted/10 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Category distribution is calculated from the competencies currently visible in the table.
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-3 rounded-lg border bg-muted/10 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                    <Network className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Scoped entries help tailor appraisal values to the right operating context without fragmenting the catalogue.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}
