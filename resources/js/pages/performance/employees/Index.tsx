import PaginationLinks from '@/components/performance/PaginationLinks';
import DeleteEmployeeDialog from '@/components/performance/employees/delete-employee-dialog';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeFieldConfigItem, EmployeeProfile, Paginated } from '@/types/performance';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';
import {
    Briefcase,
    Download,
    Eye,
    FileSpreadsheet,
    Filter,
    PencilLine,
    PieChart,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UploadCloud,
    UserCheck,
    Users,
} from 'lucide-react';

interface Props {
    employeeProfiles: Paginated<EmployeeProfile>;
    filters: { search: string };
    fieldConfig: EmployeeFieldConfigItem[];
    exportColumns: EmployeeExportColumn[];
    can: { create: boolean; import: boolean; export: boolean; delete: boolean };
}

interface EmployeeExportColumn {
    key: string;
    label: string;
    section: string;
    default: boolean;
    required: boolean;
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

export default function EmployeesIndex({ employeeProfiles, filters, fieldConfig, exportColumns, can }: Props) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    const searchForm = useForm({ search: filters.search ?? '' });
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<EmployeeProfile | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(
        exportColumns.filter((column) => column.default || column.required).map((column) => column.key),
    );

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
    const exportColumnsBySection = useMemo(() => {
        return exportColumns.reduce<Record<string, EmployeeExportColumn[]>>((groups, column) => {
            groups[column.section] = groups[column.section] ?? [];
            groups[column.section].push(column);

            return groups;
        }, {});
    }, [exportColumns]);

    const toggleExportColumn = (column: EmployeeExportColumn, checked: boolean) => {
        if (column.required) return;

        setSelectedExportColumns((current) => {
            if (checked) {
                return [...new Set([...current, column.key])];
            }

            return current.filter((key) => key !== column.key);
        });
    };

    const handleExport = () => {
        const url = new URL(route('performance.employees.export'), window.location.origin);

        if (filters.search) {
            url.searchParams.set('search', filters.search);
        }

        selectedExportColumns.forEach((column) => {
            url.searchParams.append('columns[]', column);
        });

        window.location.assign(url.toString());
        setExportModalOpen(false);
    };

    return (
        <PerformancePage
            title="Employees"
            description="Manage employee records, reporting lines, and performance readiness."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-8">
                {/* Editorial header — matches the welcome / dashboard typography */}
                <header className="bg-card relative overflow-hidden rounded-2xl border p-6 lg:p-8">
                    <div className="bg-brand-sand/12 absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl" />
                    <div className="relative">
                        <div className="font-mono-brand text-foreground/60 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                            <span className="bg-brand-sand inline-block h-px w-8" />
                            <span>§ People · Directory</span>
                        </div>
                        <h1 className="font-display text-balance text-foreground mt-4 text-4xl leading-[1] font-light tracking-tight lg:text-5xl">
                            Every person, <span className="text-brand-pine dark:text-brand-sand italic">in one place</span>.
                        </h1>
                        <p className="text-foreground/65 mt-4 max-w-2xl text-[14px] leading-relaxed">
                            Manage employee records, reporting lines, and performance readiness. Search by number, name,
                            department, or job title — and export a tailored slice whenever you need it.
                        </p>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border shadow-sm">
                        <CardContent className="flex items-center justify-between gap-4 p-6">
                            <div>
                                <p className="font-mono-brand text-muted-foreground mb-2 text-[10px] tracking-[0.22em] uppercase">
                                    Employees On This Page
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="font-display text-foreground text-4xl leading-none font-light tracking-tight">
                                        {totalOnPage}
                                    </h3>
                                    <span className="text-muted-foreground text-xs">of {totalRecords} total</span>
                                </div>
                            </div>

                            <div className="bg-muted/30 text-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border">
                                <Users className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardContent className="flex items-center justify-between gap-4 p-6">
                            <div>
                                <p className="font-mono-brand text-muted-foreground mb-2 text-[10px] tracking-[0.22em] uppercase">
                                    Active Employees
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="font-display text-foreground text-4xl leading-none font-light tracking-tight">
                                        {activeCount}
                                    </h3>
                                    <span className="text-muted-foreground text-xs">visible records</span>
                                </div>
                            </div>

                            <div className="bg-muted/30 text-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border">
                                <UserCheck className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardContent className="flex items-center justify-between gap-4 p-6">
                            <div>
                                <p className="font-mono-brand text-muted-foreground mb-2 text-[10px] tracking-[0.22em] uppercase">
                                    Review Eligible
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="font-display text-foreground text-4xl leading-none font-light tracking-tight">
                                        {reviewEligibleCount}
                                    </h3>
                                    <span className="text-muted-foreground text-xs">ready this cycle</span>
                                </div>
                            </div>

                            <div className="bg-muted/30 text-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b px-6 py-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                § Directory
                            </div>
                            <h2 className="font-display text-foreground mt-1 text-2xl leading-tight font-light tracking-tight">
                                Employee directory
                            </h2>
                            <p className="text-muted-foreground mt-1 text-[13px]">
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

                            {can.export ? (
                                <Button type="button" variant="outline" onClick={() => setExportModalOpen(true)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            ) : null}

                            {can.import ? (
                                <Button asChild variant="info">
                                    <Link href={route('performance.employees.upload')}>
                                        <UploadCloud className="mr-2 h-4 w-4" />
                                        Upload Employees
                                    </Link>
                                </Button>
                            ) : null}

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
                                        <th key={column.field_key} className="font-mono-brand text-muted-foreground px-6 py-4 text-[10px] tracking-[0.22em] uppercase">
                                            {column.label}
                                        </th>
                                    ))}
                                    <th className="font-mono-brand text-muted-foreground px-6 py-4 text-right text-[10px] tracking-[0.22em] uppercase">
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
                                                <div className="flex justify-end gap-2">
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

                                                    {can.delete && profile.user_id !== auth.user.id ? (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            title={`Delete ${profile.user?.name ?? profile.employee_number}`}
                                                            onClick={() => {
                                                                setDeleteTarget(profile);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">
                                                                Delete {profile.user?.name ?? profile.employee_number}
                                                            </span>
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={visibleColumns.length + 1} className="px-6 py-14 text-center">
                                            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                <div className="bg-muted text-muted-foreground rounded-full border p-3">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div className="font-display text-foreground text-xl font-light">
                                                    No employee profiles found
                                                </div>
                                                <p className="text-muted-foreground text-[13px]">
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

                <DeleteEmployeeDialog employee={deleteTarget} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />

                <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                § Export
                            </div>
                            <DialogTitle className="font-display flex items-center gap-2 text-2xl font-light tracking-tight">
                                <FileSpreadsheet className="h-5 w-5" />
                                Export Employees
                            </DialogTitle>
                            <DialogDescription className="text-[13px]">
                                Choose the columns to include in the employee spreadsheet.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
                            {Object.entries(exportColumnsBySection).map(([section, columns]) => (
                                <section key={section} className="space-y-3">
                                    <h3 className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                        {labelize(section)}
                                    </h3>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {columns.map((column) => {
                                            const checked = selectedExportColumns.includes(column.key);

                                            return (
                                                <label
                                                    key={column.key}
                                                    className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm"
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        disabled={column.required}
                                                        onCheckedChange={(value) => toggleExportColumn(column, value === true)}
                                                    />
                                                    <span className="flex-1 font-medium text-foreground">{column.label}</span>
                                                    {column.required ? <Badge variant="outline">Required</Badge> : null}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setExportModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleExport} disabled={selectedExportColumns.length === 0}>
                                <Download className="mr-2 h-4 w-4" />
                                Download XLSX
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border shadow-sm">
                        <CardContent className="flex gap-4 p-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/30 text-foreground">
                                <ShieldCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                    § Note
                                </div>
                                <h4 className="font-display text-foreground mt-1 text-xl font-light tracking-tight">
                                    Profile coverage
                                </h4>
                                <p className="text-muted-foreground mt-1 text-[13px] leading-6">
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
                                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                    § Note
                                </div>
                                <h4 className="font-display text-foreground mt-1 text-xl font-light tracking-tight">
                                    Performance setup
                                </h4>
                                <p className="text-muted-foreground mt-1 text-[13px] leading-6">
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
            const score = effectiveLatestScore(profile);

            return (
                <div className="flex items-center gap-2">
                    <ScoreDonut score={score} />
                    <div className="text-xs text-muted-foreground">
                        {score !== null && score !== undefined
                            ? `${Number(score).toFixed(1)}%`
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

function effectiveLatestScore(profile: EmployeeProfile) {
    return profile.latest_appraisal?.calibrated_overall_score ?? profile.latest_appraisal?.overall_score;
}

function labelize(value: string) {
    return value.replace(/[_-]/g, ' ');
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
