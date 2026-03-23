import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { GoalLibraryItem, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
    BookOpen,
    Briefcase,
    Filter,
    FolderKanban,
    Layers3,
    Plus,
    Search,
    Target,
    View,
    PencilLine,
} from 'lucide-react';

interface Props {
    goalLibraryItems: Paginated<GoalLibraryItem>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Goal Library', href: route('performance.goal_library.index') },
];

function getAlignmentLabel(item: GoalLibraryItem) {
    const hasPerspective = !!item.perspective?.name;
    const hasDepartment = !!item.department?.name;

    if (hasPerspective && hasDepartment) return 'High';
    if (hasPerspective || hasDepartment) return 'Standard';
    return 'Basic';
}

function getAlignmentVariant(item: GoalLibraryItem): 'default' | 'secondary' | 'outline' {
    const label = getAlignmentLabel(item);

    if (label === 'High') return 'default';
    if (label === 'Standard') return 'secondary';
    return 'outline';
}

export default function GoalLibraryIndex({ goalLibraryItems, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(route('performance.goal_library.index'), { search }, { preserveState: true, replace: true });
    };

    const totalVisible = goalLibraryItems.data.length;
    const totalCount = goalLibraryItems.total ?? totalVisible;

    const perspectiveCoverage = useMemo(
        () =>
            new Set(
                goalLibraryItems.data
                    .map((item) => item.perspective?.name)
                    .filter((value): value is string => Boolean(value)),
            ).size,
        [goalLibraryItems.data],
    );

    const departmentCoverage = useMemo(
        () =>
            new Set(
                goalLibraryItems.data
                    .map((item) => item.department?.name)
                    .filter((value): value is string => Boolean(value)),
            ).size,
        [goalLibraryItems.data],
    );

    const highAlignmentCount = useMemo(
        () => goalLibraryItems.data.filter((item) => getAlignmentLabel(item) === 'High').length,
        [goalLibraryItems.data],
    );

    const from = goalLibraryItems.from ?? 0;
    const to = goalLibraryItems.to ?? totalVisible;

    return (
        <PerformancePage
            title="Goal Library"
            description="Reusable SMART goals for departments, roles, and perspectives."
            breadcrumbs={breadcrumbs}
            primaryAction={
                can.create
                    ? {
                          label: 'New Goal',
                          href: route('performance.goal_library.create'),
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
                                Goal catalog
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Goal Library</h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Reusable SMART goals categorized by department and strategic perspective to support
                                    consistent planning across the organization.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Total goals</div>
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
                                <BookOpen className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Library Goals</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{totalVisible}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Goal templates currently visible in the filtered catalog.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Perspective Coverage</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{perspectiveCoverage}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Unique strategic perspectives represented in this result set.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Briefcase className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Department Alignment</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{departmentCoverage}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Departments linked to the visible goal templates.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Search & Filter</CardTitle>
                                <CardDescription>
                                    Find reusable goals by title, department, or strategic perspective.
                                </CardDescription>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                {highAlignmentCount} high-alignment goal{highAlignmentCount === 1 ? '' : 's'}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search goal library"
                                    className="pl-9"
                                />
                            </div>

                            <Button type="submit" variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Goal Catalog</CardTitle>
                                <CardDescription>
                                    Browse goal templates, perspective tags, department ownership, and available
                                    actions.
                                </CardDescription>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Showing {from} to {to} of {totalCount}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {goalLibraryItems.data.length === 0 ? (
                            <div className="flex min-h-[280px] items-center justify-center p-6">
                                <div className="space-y-2 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                                        <FolderKanban className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">No goals found</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Try adjusting your search to find matching goal templates.
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
                                                    Goal Title
                                                </th>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Perspective
                                                </th>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Department
                                                </th>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Alignment
                                                </th>
                                                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {goalLibraryItems.data.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-t transition-colors hover:bg-muted/20"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex min-w-[240px] items-start gap-3">
                                                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                                                                <Target className="h-4 w-4 text-muted-foreground" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="font-medium text-foreground">
                                                                    {item.title}
                                                                </div>
                                                                <div className="mt-1 text-xs text-muted-foreground">
                                                                    Reusable goal template
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <Badge variant="secondary">
                                                            {item.perspective?.name ?? '-'}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-6 py-5 text-muted-foreground">
                                                        {item.department?.name ?? '-'}
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <Badge variant={getAlignmentVariant(item)}>
                                                            {getAlignmentLabel(item)}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end gap-2">
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link href={route('performance.goal_library.show', item.id)}>
                                                                    <View className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>

                                                            <Button asChild variant="secondary" size="sm">
                                                                <Link href={route('performance.goal_library.edit', item.id)}>
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