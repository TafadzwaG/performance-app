import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeFieldConfigItem, EmployeeProfile, Paginated } from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    Briefcase,
    Eye,
    Filter,
    PencilLine,
    PieChart,
    Plus,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';

interface Props {
    employeeProfiles: Paginated<EmployeeProfile>;
    filters: { search: string };
    fieldConfig: EmployeeFieldConfigItem[];
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
];

function getInitials(name?: string | null) {
    return (name ?? 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function maskNationalId(value?: string | null) {
    if (!value) return '-';

    const clean = value.trim();
    if (clean.length <= 4) return clean;

    return `*** ** ${clean.slice(-4)}`;
}

export default function EmployeesIndex({ employeeProfiles, filters, fieldConfig, can }: Props) {
    const searchForm = useForm({ search: filters.search ?? '' });

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        searchForm.get(route('performance.employees.index'), {
            preserveState: true,
            replace: true,
        });
    };

    const totalOnPage = employeeProfiles.data.length;
    const totalRecords = employeeProfiles.total ?? totalOnPage;
    const activeCount = employeeProfiles.data.filter((profile) => profile.is_active).length;
    const reviewEligibleCount = employeeProfiles.data.filter((profile) => profile.is_review_eligible ?? true).length;

    const from = employeeProfiles.from ?? 0;
    const to = employeeProfiles.to ?? totalOnPage;
    const visibleColumns = fieldConfig.filter((field) => field.enabled);

    return (
        <PerformancePage
            title="Employees"
            description="Manage employee records, reporting lines, and performance readiness."
            breadcrumbs={breadcrumbs}
          
        >
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                Employees On This Page
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold tracking-tight text-foreground">{totalOnPage}</h3>
                                <span className="text-xs text-muted-foreground">of {totalRecords} total</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                Active Employees
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold tracking-tight text-foreground">{activeCount}</h3>
                                <span className="text-xs text-muted-foreground">visible records</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                Review Eligible
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                                    {reviewEligibleCount}
                                </h3>
                                <span className="text-xs text-muted-foreground">ready this cycle</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">Employee Directory</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Search profiles by employee number, name, email, or national ID.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <form onSubmit={submitSearch} className="flex gap-2">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchForm.data.search}
                                        onChange={(event) => searchForm.setData('search', event.target.value)}
                                        placeholder="Search directory..."
                                        className="w-[240px] pl-9"
                                    />
                                </div>

                                <Button type="submit" variant="outline" disabled={searchForm.processing}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>
                            </form>

                            {can.create ? (
                                <Button asChild>
                                    <Link href={route('performance.employees.create')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New Employee
                                    </Link>
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="bg-muted/30">
                                    {visibleColumns.map((column) => (
                                        <th key={column.field_key} className="px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            {column.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-right text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {employeeProfiles.data.length > 0 ? (
                                    employeeProfiles.data.map((profile) => (
                                        <tr
                                            key={profile.id}
                                            className="group transition-colors hover:bg-muted/20"
                                        >
                                            {visibleColumns.map((column) => (
                                                <td key={column.field_key} className="px-6 py-4">
                                                    {renderIndexColumn(profile, column)}
                                                </td>
                                            ))}

                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                                    <Button asChild variant="ghost" size="icon">
                                                        <Link href={route('performance.employees.show', profile.id)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>

                                                    <Button asChild variant="ghost" size="icon">
                                                        <Link href={route('performance.employees.edit', profile.id)}>
                                                            <PencilLine className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={visibleColumns.length + 1} className="px-6 py-14 text-center">
                                            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                <div className="rounded-full border bg-muted p-3 text-muted-foreground">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div className="font-medium">No employee profiles found</div>
                                                <p className="text-sm text-muted-foreground">
                                                    Adjust the search term or create a new employee profile.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-4 border-t bg-muted/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                            Showing {from} to {to} of {totalRecords} entries
                        </p>

                        <PaginationLinks paginated={employeeProfiles} />
                    </div>
                </section>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border shadow-sm">
                        <CardContent className="flex gap-4 p-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/30 text-foreground">
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-tight text-foreground">
                                    Profile Coverage
                                </h4>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    Use employee profiles to connect users, reporting lines, and appraisal ownership in
                                    one place.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardContent className="flex gap-4 p-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/30 text-foreground">
                                <Briefcase className="h-5 w-5" />
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold uppercase tracking-tight text-foreground">
                                    Performance Setup
                                </h4>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    Work location, employment type, eligibility, and manager assignments are maintained
                                    on the employee profile.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}

function renderIndexColumn(profile: EmployeeProfile, column: EmployeeFieldConfigItem) {
    switch (column.field_key) {
        case 'user_name':
            return (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/30 text-xs font-semibold text-foreground">
                        {getInitials(profile.user?.name)}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{profile.user?.name ?? 'Unknown user'}</p>
                    </div>
                </div>
            );
        case 'employee_number':
            return <span className="text-sm font-medium text-foreground">{profile.employee_number}</span>;
        case 'national_id':
            return <span className="font-mono tracking-tight text-sm text-muted-foreground">{maskNationalId(profile.national_id)}</span>;
        case 'department_id':
            return <span className="text-sm text-muted-foreground">{profile.department?.name ?? '-'}</span>;
        case 'job_title_id':
            return <span className="text-sm font-medium text-foreground">{profile.job_title?.name ?? '-'}</span>;
        case 'line_manager_user_id':
            return <span className="text-sm text-muted-foreground">{profile.line_manager?.name ?? '-'}</span>;
        case 'latest_overall_score':
            return (
                <div className="flex items-center gap-2">
                    <ScoreDonut score={profile.latest_appraisal?.overall_score} />
                    <div className="text-xs text-muted-foreground">
                        {profile.latest_appraisal?.overall_score !== null && profile.latest_appraisal?.overall_score !== undefined
                            ? `${Number(profile.latest_appraisal.overall_score).toFixed(1)}%`
                            : '-'}
                    </div>
                </div>
            );
        case 'employment_status':
            return (
                <div className="flex flex-wrap gap-2">
                    <Badge variant={profile.is_active ? 'default' : 'secondary'}>{profile.employment_status}</Badge>
                    {profile.is_review_eligible ?? true ? <Badge variant="outline">Review Eligible</Badge> : null}
                </div>
            );
        default:
            return <span className="text-sm text-muted-foreground">-</span>;
    }
}

function ScoreDonut({ score }: { score?: number | null }) {
    const numericScore = score === null || score === undefined ? null : Number(score);
    const normalized = numericScore === null || Number.isNaN(numericScore)
        ? null
        : Math.max(0, Math.min(100, numericScore));

    const colorClass =
        normalized === null
            ? 'var(--muted-foreground)'
            : normalized >= 80
              ? 'var(--chart-2)'
              : normalized >= 60
                ? 'var(--chart-4)'
                : 'var(--destructive)';

    return (
        <div className="relative h-9 w-9 shrink-0 rounded-full border border-border/60 bg-muted/20 p-1">
            <div
                className="h-full w-full rounded-full"
                style={{
                    background:
                        normalized === null
                            ? 'conic-gradient(var(--muted) 100%, transparent 0)'
                            : `conic-gradient(${colorClass} ${normalized}%, var(--muted) ${normalized}% 100%)`,
                }}
            />
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-background text-[9px] font-semibold text-foreground">
                {normalized === null ? <PieChart className="h-2.5 w-2.5 text-muted-foreground" /> : `${Math.round(normalized)}`}
            </div>
        </div>
    );
}
