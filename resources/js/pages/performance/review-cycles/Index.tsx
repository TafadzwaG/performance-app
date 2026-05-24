import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import AssignEmployeesModal from '@/components/performance/review-cycles/AssignEmployeesModal';
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
import type { BreadcrumbItem } from '@/types';
import type { Option, Paginated, ReviewCycle } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import { CalendarRange, Clock3, Eye, History, PencilLine, Plus, RefreshCcw, Trash2, UserPlus, Users } from 'lucide-react';
import moment from 'moment';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Review Cycles', href: route('performance.review_cycles.index') },
];

function normalizeStatus(status?: string | null) {
    return (status ?? 'unknown').replaceAll('_', ' ');
}

function getStatusVariant(status?: string | null): 'default' | 'secondary' | 'outline' {
    const value = (status ?? '').toLowerCase();

    if (value.includes('active') || value.includes('progress') || value.includes('open')) {
        return 'default';
    }

    if (value.includes('closed') || value.includes('completed') || value.includes('final')) {
        return 'secondary';
    }

    return 'outline';
}

function getCycleSubtitle(status?: string | null) {
    const value = (status ?? '').toLowerCase();

    if (value.includes('active') || value.includes('progress') || value.includes('open')) {
        return 'Active period';
    }

    if (value.includes('goal')) {
        return 'Goal setting';
    }

    if (value.includes('closed') || value.includes('completed')) {
        return 'Archive';
    }

    return 'Planning window';
}

interface Props {
    reviewCycles: Paginated<ReviewCycle>;
    employeeProfileOptions: Option[];
    templateOptions: Option[];
    can?: {
        create?: boolean;
        assignEmployees?: boolean;
        delete?: boolean;
    };
}

export default function ReviewCyclesIndex({ reviewCycles, employeeProfileOptions, templateOptions, can }: Props) {
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ReviewCycle | null>(null);

    const totalCycles = reviewCycles.total ?? reviewCycles.data.length;
    const from = reviewCycles.from ?? 0;
    const to = reviewCycles.to ?? reviewCycles.data.length;
    const totalAssignedEmployees = reviewCycles.data.reduce((total, cycle) => total + (cycle.appraisals_count ?? 0), 0);

    const activeCycles = reviewCycles.data.filter((cycle) => {
        const value = (cycle.status ?? '').toLowerCase();
        return value.includes('active') || value.includes('progress') || value.includes('open');
    }).length;

    const openAssignModal = (cycle: ReviewCycle) => {
        setSelectedCycle(cycle);
        setAssignModalOpen(true);
    };

    const deleteCycle = () => {
        if (!deleteTarget) {
            return;
        }

        router.delete(route('performance.review_cycles.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    return (
        <PerformancePage
            title="Review Cycles"
            description="Create, open, close, and monitor appraisal cycles."
            breadcrumbs={breadcrumbs}
           
        >
            <div className="space-y-6">
                <div className="bg-background rounded-2xl border p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Cycle workspace
                            </Badge>

                            <div>
                                <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">Review Cycles</h1>
                                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                                    Manage organizational performance evaluation periods, track review windows, and monitor cycle progress in one
                                    structured workspace.
                                </p>
                            </div>
                        </div>

                        {can?.create ? (
                            <Button asChild>
                                <Link href={route('performance.review_cycles.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Cycle
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <RefreshCcw className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{totalCycles}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Review cycle records available in the current directory.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <Clock3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Active Windows</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{activeCycles}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Cycles currently in progress or open for execution.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <Users className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Assigned Employees</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{totalAssignedEmployees}</div>
                            <p className="text-muted-foreground mt-2 text-xs">Employees currently assigned across visible cycles.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/20 border-b">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Organizational History</CardTitle>
                                <CardDescription>Review cycle names, active dates, statuses, and available actions.</CardDescription>
                            </div>

                            <div className="text-muted-foreground text-xs">
                                Showing {from} to {to} of {totalCycles}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {reviewCycles.data.length === 0 ? (
                            <div className="flex min-h-[280px] items-center justify-center p-6">
                                <div className="space-y-2 text-center">
                                    <div className="bg-muted/30 mx-auto flex h-12 w-12 items-center justify-center rounded-full border">
                                        <History className="text-muted-foreground h-5 w-5" />
                                    </div>
                                    <h3 className="text-foreground text-base font-semibold">No review cycles found</h3>
                                    <p className="text-muted-foreground text-sm">There are no appraisal cycles available right now.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-muted/30 text-left">
                                            <tr>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Cycle Name
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Dates
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Status
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Assigned
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Created
                                                </th>
                                                <th className="text-muted-foreground px-6 py-4 text-right text-[11px] font-semibold tracking-[0.16em] uppercase">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {reviewCycles.data.map((cycle, index) => (
                                                <tr
                                                    key={cycle.id}
                                                    className={`hover:bg-muted/20 border-t transition-colors ${
                                                        index % 2 === 1 ? 'bg-muted/[0.03]' : ''
                                                    }`}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex min-w-[240px] items-start gap-3">
                                                            <div className="bg-muted/30 mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg border">
                                                                <RefreshCcw className="text-muted-foreground h-4.5 w-4.5" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="text-foreground font-semibold">{cycle.name}</div>
                                                                <div className="text-muted-foreground mt-1 text-xs">
                                                                    Focus: {getCycleSubtitle(cycle.status)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="text-muted-foreground flex items-start gap-2">
                                                            <CalendarRange className="mt-0.5 h-4 w-4 shrink-0" />
                                                            <div>
                                                                <div className="text-foreground font-medium">
                                                                    {moment(cycle.start_date).format('MMM Do YYYY')} -{' '}
                                                                    {moment(cycle.end_date).format('MMM Do YYYY')}
                                                                </div>
                                                                <div className="text-muted-foreground mt-1 text-[11px] tracking-wide uppercase">
                                                                    {getCycleSubtitle(cycle.status)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <Badge variant={getStatusVariant(cycle.status)}>{normalizeStatus(cycle.status)}</Badge>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <Badge variant="secondary">{cycle.appraisals_count ?? 0}</Badge>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="text-foreground font-medium">
                                                            {cycle.created_at ? moment(cycle.created_at).format('MMM Do YYYY') : '—'}
                                                        </div>
                                                        {cycle.created_at ? (
                                                            <div className="text-muted-foreground mt-1 text-[11px]">
                                                                {moment(cycle.created_at).format('h:mm A')}
                                                            </div>
                                                        ) : null}
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end gap-2">
                                                            {can?.assignEmployees ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openAssignModal(cycle)}
                                                                    title="Assign Employees"
                                                                >
                                                                    <UserPlus className="h-4 w-4" />
                                                                </Button>
                                                            ) : null}

                                                            <Button asChild variant="ghost" size="icon">
                                                                <Link href={route('performance.review_cycles.show', cycle.id)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>

                                                            <Button asChild variant="ghost" size="icon">
                                                                <Link href={route('performance.review_cycles.edit', cycle.id)}>
                                                                    <PencilLine className="h-4 w-4" />
                                                                </Link>
                                                            </Button>

                                                            {can?.delete ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => setDeleteTarget(cycle)}
                                                                    title="Delete cycle"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                <div className="bg-muted/10 flex flex-col gap-4 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
                                    <span className="text-muted-foreground text-xs font-medium">
                                        Showing {from} to {to} of {totalCycles} results
                                    </span>

                                    <PaginationLinks paginated={reviewCycles} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AssignEmployeesModal
                open={assignModalOpen}
                onOpenChange={setAssignModalOpen}
                reviewCycle={selectedCycle ? { id: selectedCycle.id, name: selectedCycle.name } : null}
                employeeProfileOptions={employeeProfileOptions}
                templateOptions={templateOptions}
            />

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete review cycle?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    This will permanently delete{' '}
                                    <span className="font-medium text-foreground">{deleteTarget?.name ?? 'this review cycle'}</span> and cannot be
                                    undone.
                                </p>
                                <p>
                                    <span className="font-medium text-foreground">{deleteTarget?.appraisals_count ?? 0}</span>{' '}
                                    {(deleteTarget?.appraisals_count ?? 0) === 1 ? 'appraisal' : 'appraisals'} attached to this cycle will also be
                                    deleted, including objectives, ratings, comments, approvals, and development plans.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={deleteCycle}
                        >
                            Delete cycle
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PerformancePage>
    );
}
