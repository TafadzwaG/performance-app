import PaginationLinks from '@/components/performance/PaginationLinks';
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
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { GoalLibraryItem, GoalLibraryScope, Option, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import {
    BookOpen,
    Briefcase,
    Download,
    Filter,
    FolderKanban,
    Layers3,
    PencilLine,
    Plus,
    Search,
    SlidersHorizontal,
    Target,
    Trash2,
    Upload,
    View,
    X,
} from 'lucide-react';
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
    can: { create: boolean; import: boolean; export: boolean; archive: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Goal Library', href: route('performance.goal_library.index') },
];

const selectClassName =
    'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

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

export default function GoalLibraryIndex({
    goalLibraryItems,
    filters,
    departmentOptions,
    jobTitleOptions,
    perspectiveOptions,
    scope,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [departmentId, setDepartmentId] = useState(filters.department_id ?? '');
    const [jobTitleId, setJobTitleId] = useState(filters.job_title_id ?? '');
    const [perspectiveId, setPerspectiveId] = useState(filters.perspective_id ?? '');
    const [deleteTarget, setDeleteTarget] = useState<GoalLibraryItem | null>(null);

    const activeFilterCount = useMemo(
        () => [search, departmentId, jobTitleId, perspectiveId].filter(Boolean).length,
        [search, departmentId, jobTitleId, perspectiveId],
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('performance.goal_library.index'),
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

        router.get(route('performance.goal_library.index'), {}, { preserveState: true, replace: true });
    };

    const handleExport = () => {
        const url = new URL(route('performance.goal_library.export'), window.location.origin);

        if (filters.search) {
            url.searchParams.set('search', filters.search);
        }

        if (filters.department_id) {
            url.searchParams.set('department_id', filters.department_id);
        }

        if (filters.job_title_id) {
            url.searchParams.set('job_title_id', filters.job_title_id);
        }

        if (filters.perspective_id) {
            url.searchParams.set('perspective_id', filters.perspective_id);
        }

        window.location.assign(url.toString());
    };

    const deleteGoal = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(route('performance.goal_library.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    const totalVisible = goalLibraryItems.data.length;
    const totalCount = goalLibraryItems.total ?? totalVisible;

    const perspectiveCoverage = useMemo(
        () => new Set(goalLibraryItems.data.map((item) => item.perspective?.name).filter((value): value is string => Boolean(value))).size,
        [goalLibraryItems.data],
    );

    const departmentCoverage = useMemo(
        () => new Set(goalLibraryItems.data.map((item) => item.department?.name).filter((value): value is string => Boolean(value))).size,
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
            secondaryActions={
                can.import ? (
                    <>
                        <Button asChild variant="outline" size="sm">
                            <a href={route('performance.goal_library.upload.template')}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('performance.goal_library.upload')}>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Goals
                            </Link>
                        </Button>
                    </>
                ) : undefined
            }
        >
            <div className="space-y-6">
                <div className="bg-background rounded-2xl border p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Goal catalog
                            </Badge>

                            <div>
                                <h1 className="text-foreground text-3xl font-bold tracking-tight">Goal Library</h1>
                                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                                    {scope.locked
                                        ? `Goals for ${scope.department_label ?? 'your department'} and ${scope.job_title_label ?? 'your job title'}.`
                                        : 'Reusable SMART goals categorized by department, position, and strategic perspective to support consistent planning across the organization.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground text-xs tracking-wide uppercase">Total goals</div>
                                <div className="text-foreground mt-1 font-semibold">{totalCount}</div>
                            </div>

                            <div className="bg-muted/30 rounded-xl border px-4 py-3 text-sm">
                                <div className="text-muted-foreground text-xs tracking-wide uppercase">Visible now</div>
                                <div className="text-foreground mt-1 font-semibold">{totalVisible}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <BookOpen className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Library Goals</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{totalVisible}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Goal templates currently visible in the filtered catalog.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <Layers3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Perspective Coverage</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{perspectiveCoverage}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Unique strategic perspectives represented in this result set.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <Briefcase className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Department Alignment</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{departmentCoverage}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Departments linked to the visible goal templates.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/20 border-b">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Search & Filter</CardTitle>
                                <CardDescription>
                                    {scope.locked
                                        ? 'Search by title or KPI, then filter by perspective within your department and job title.'
                                        : 'Search by title or KPI, then narrow results by department, position, and perspective.'}
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>
                                    {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
                                </span>
                                {highAlignmentCount > 0 ? (
                                    <Badge variant="outline" className="ml-1">
                                        {highAlignmentCount} high alignment
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
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
                                            placeholder="Search title or KPI"
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
                                                Position
                                            </label>
                                            <select className={selectClassName} value={jobTitleId} onChange={(event) => setJobTitleId(event.target.value)}>
                                                <option value="">All positions</option>
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

                                {can.export ? (
                                    <Button type="button" variant="outline" onClick={handleExport}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Filtered
                                    </Button>
                                ) : null}

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
                                <CardTitle className="text-lg">Goal Catalog</CardTitle>
                                <CardDescription>
                                    Browse goal templates, perspective tags, department ownership, and available actions.
                                </CardDescription>
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
                                    <h3 className="text-foreground text-base font-semibold">No goals found</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Try adjusting your search or filters to find matching goal templates.
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
                                                    Actions
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
                                                                <div className="text-muted-foreground mt-1 text-xs">Reusable goal template</div>
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

                                                            <Button asChild variant="secondary" size="sm">
                                                                <Link href={route('performance.goal_library.edit', item.id)}>
                                                                    <PencilLine className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </Button>

                                                            {can.archive ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => setDeleteTarget(item)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </Button>
                                                            ) : null}
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

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete goal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove {deleteTarget ? `"${deleteTarget.title}"` : 'this goal'} from the active goal library. Existing appraisals
                            that already used this template keep their recorded objectives.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteGoal}>
                            Delete Goal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PerformancePage>
    );
}
