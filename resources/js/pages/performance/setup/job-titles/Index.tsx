import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { JobTitle, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
    BarChart3,
    Briefcase,
    Eye,
    Filter,
    PencilLine,
    Plus,
    Search,
    ShieldAlert,
    Wrench,
} from 'lucide-react';

interface Props {
    jobTitles: Paginated<JobTitle>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Job Titles', href: '/performance/setup/job-titles' },
];

function getPrefix(code?: string | null) {
    if (!code) return 'Other';
    const [prefix] = code.split('-');
    return prefix || 'Other';
}

function buildDistribution(items: JobTitle[]) {
    const counts = items.reduce<Record<string, number>>((acc, item) => {
        const key = getPrefix(item.code);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
}

export default function JobTitlesIndex({ jobTitles, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const activeCount = jobTitles.data.filter((jobTitle) => jobTitle.is_active).length;
    const inactiveCount = jobTitles.data.filter((jobTitle) => !jobTitle.is_active).length;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.setup.job_titles.index'), { search }, { preserveState: true, replace: true });
    };

    const totalOnPage = jobTitles.data.length;
    const totalResults = jobTitles.total ?? totalOnPage;
    const from = jobTitles.from ?? 0;
    const to = jobTitles.to ?? totalOnPage;

    const distribution = useMemo(() => buildDistribution(jobTitles.data), [jobTitles.data]);
    const maxDistribution = Math.max(...distribution.map(([, count]) => count), 1);

    return (
        <PerformancePage
            title="Job Titles"
            description="Manage the job title catalogue used for employee profiles and templates."
            breadcrumbs={breadcrumbs}
           
        >
            <div className="space-y-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Job Titles Index</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Manage organizational roles, hierarchy codes, and operational status.
                            </p>
                        </div>

                        {can.create ? (
                            <Button asChild>
                                <Link href={route('performance.setup.job_titles.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Job Title
                                </Link>
                            </Button>
                        ) : null}
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="shadow-sm">
                            <CardContent className="flex h-32 flex-col justify-between p-6">
                                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Job Titles On This Page
                                </span>

                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">
                                        {totalOnPage}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Entries</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardContent className="flex h-32 flex-col justify-between p-6">
                                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Active Job Titles
                                </span>

                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">
                                        {activeCount}
                                    </span>
                                    <Badge variant="secondary">{totalOnPage > 0 ? `${Math.round((activeCount / totalOnPage) * 100)}% live` : '0% live'}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden shadow-sm">
                            <CardContent className="flex h-32 flex-col justify-between p-6">
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <Briefcase className="h-24 w-24" />
                                </div>

                                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Total Results
                                </span>

                                <div className="flex items-end justify-between">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">
                                        {totalResults}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Global System</span>
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
                                        placeholder="Filter by title, code or description..."
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
                                        Job Title Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        Code
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
                                {jobTitles.data.length > 0 ? (
                                    jobTitles.data.map((jobTitle) => (
                                        <tr key={jobTitle.id} className="group transition-colors hover:bg-muted/20">
                                            <td className="px-6 py-5">
                                                <div className="font-semibold text-foreground">{jobTitle.name}</div>
                                                <div className="mt-0.5 text-xs text-muted-foreground">
                                                    {jobTitle.description ?? 'No description'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium text-muted-foreground">
                                                    {jobTitle.code}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <Badge variant={jobTitle.is_active ? 'secondary' : 'outline'}>
                                                    {jobTitle.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={route('performance.setup.job_titles.show', jobTitle.id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </Button>

                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={route('performance.setup.job_titles.edit', jobTitle.id)}>
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
                                        <td colSpan={4} className="p-10 text-center text-sm text-muted-foreground">
                                            No job titles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-4 border-t bg-muted/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-xs font-medium text-muted-foreground">
                            Showing {from} to {to} of {totalResults} job titles
                        </div>

                        <PaginationLinks paginated={jobTitles} />
                    </div>
                </Card>

                <div className="grid gap-8 lg:grid-cols-2">
                    <Card className="relative overflow-hidden border shadow-sm">
                        <CardContent className="p-8">
                            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-muted/40 blur-3xl" />

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold tracking-tight text-foreground">Hierarchy Intelligence</h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    The current page shows {inactiveCount} inactive job title{inactiveCount === 1 ? '' : 's'}.
                                    Review inactive catalogue entries to keep assignments and reporting structures clean.
                                </p>

                                <Button variant="outline" className="mt-6">
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Review Inactive Titles
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl tracking-tight">Catalogue Distribution</CardTitle>
                            <CardDescription>
                                Top visible title groups by code prefix on this page.
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
                                    Prefix counts are inferred from job title codes currently visible in the table.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}