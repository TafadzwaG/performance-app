import { AsyncSearchSelect, type AsyncOption } from '@/components/async-search-select';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    Building2,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    FileText,
    Layers3,
    Mail,
    MapPin,
    Plus,
    ShieldCheck,
    UserRound,
    Users,
    Wand2,
    X,
} from 'lucide-react';
import * as React from 'react';
import type { FormEvent } from 'react';

/* ---------- option shapes returned by the lookup endpoints ---------- */

interface EmployeeOption extends AsyncOption {
    employee_number: string;
    name: string;
    department: string | null;
    job_title: string | null;
    has_approving_manager: boolean;
}

interface CycleOption extends AsyncOption {
    code: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
}

interface TemplateOption extends AsyncOption {
    code: string;
    business_weight_percent: number;
    values_weight_percent: number;
    min_objectives: number;
    max_objectives: number;
}

interface EmployeeDetailResponse {
    profile: {
        id: number;
        employee_number: string;
        name: string | null;
        email: string | null;
        department: string | null;
        job_title: string | null;
        employment_status: string | null;
        employment_type: string | null;
        work_location: string | null;
        hire_date: string | null;
        confirmation_date: string | null;
        is_review_eligible: boolean;
        line_manager: string | null;
        approving_manager: string | null;
        approving_manager_email: string | null;
        has_approving_manager: boolean;
    };
    latest_appraisal: {
        id: number;
        cycle_name: string;
        template_name: string;
        status: string;
        updated_at: string;
    } | null;
    appraisal_count: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: 'Create', href: route('performance.appraisals.create') },
];

/* ----------------------------------------------------------------------- */

export default function AppraisalCreate() {
    const { data, setData, post, processing, errors } = useForm({
        review_cycle_id: '',
        employee_profile_id: '',
        template_id: '',
    });

    const [selectedCycle, setSelectedCycle] = React.useState<CycleOption | null>(null);
    const [selectedEmployee, setSelectedEmployee] = React.useState<EmployeeOption | null>(null);
    const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateOption | null>(null);

    const [detail, setDetail] = React.useState<EmployeeDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = React.useState(false);

    const [bulkOpen, setBulkOpen] = React.useState(false);

    // Fetch employee detail whenever the selection changes.
    React.useEffect(() => {
        if (!data.employee_profile_id) {
            setDetail(null);
            return;
        }
        const controller = new AbortController();
        setDetailLoading(true);
        fetch(
            route('performance.appraisals.lookup.employee_detail', { employee_profile: data.employee_profile_id }),
            {
                signal: controller.signal,
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            },
        )
            .then((response) => (response.ok ? (response.json() as Promise<EmployeeDetailResponse>) : null))
            .then((payload) => {
                if (payload) setDetail(payload);
            })
            .catch(() => {
                /* aborted or network — surface via empty state below */
            })
            .finally(() => setDetailLoading(false));

        return () => controller.abort();
    }, [data.employee_profile_id]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.appraisals.store'));
    };

    const canSubmit = Boolean(data.review_cycle_id && data.employee_profile_id && data.template_id) && !processing;

    return (
        <PerformancePage
            title="Create Appraisal"
            description="Assign a single appraisal — or open the bulk modal to assign to many."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                {/* ===================================================== Header strip */}
                <div className="bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm lg:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Manual appraisal assignment
                            </Badge>
                            <div>
                                <h1 className="text-foreground text-3xl font-bold tracking-tight">Create Appraisal</h1>
                                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                                    Initiate a formal performance assessment by selecting the review cycle, employee,
                                    and appraisal template. Need to assign many at once? Open the bulk modal.
                                </p>
                            </div>
                        </div>

                        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                            <DialogTrigger asChild>
                                <Button variant="accent" size="lg">
                                    <Users className="mr-2 h-4 w-4" />
                                    Assign to many
                                </Button>
                            </DialogTrigger>
                            <BulkAssignDialog onClose={() => setBulkOpen(false)} />
                        </Dialog>
                    </div>
                </div>

                {/* ===================================================== Setup card */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg">Appraisal Setup</CardTitle>
                        <CardDescription>
                            Each dropdown searches the catalogue as you type — no need to scroll long lists.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Review cycle */}
                                <FieldShell
                                    label="Review Cycle"
                                    icon={Layers3}
                                    error={errors.review_cycle_id}
                                    hint={selectedCycle?.code ?? 'Type to search by name or code'}
                                >
                                    <AsyncSearchSelect<CycleOption>
                                        endpoint={route('performance.appraisals.lookup.cycles')}
                                        value={data.review_cycle_id || null}
                                        onChange={(value, option) => {
                                            setData('review_cycle_id', value ? String(value) : '');
                                            setSelectedCycle(option ?? null);
                                        }}
                                        placeholder="Search cycles…"
                                        renderOption={(option) => (
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-medium">{option.label}</span>
                                                <span className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.16em] uppercase">
                                                    {option.code} · {option.status ?? 'unknown'} ·{' '}
                                                    {option.start_date ?? '—'} → {option.end_date ?? '—'}
                                                </span>
                                            </div>
                                        )}
                                    />
                                </FieldShell>

                                {/* Employee */}
                                <FieldShell
                                    label="Employee"
                                    icon={UserRound}
                                    error={errors.employee_profile_id}
                                    hint={
                                        selectedEmployee?.employee_number
                                            ? `${selectedEmployee.employee_number} · ${selectedEmployee.department ?? '—'}`
                                            : 'Type a name, email, number, department, or job title'
                                    }
                                >
                                    <AsyncSearchSelect<EmployeeOption>
                                        endpoint={route('performance.appraisals.lookup.employees')}
                                        value={data.employee_profile_id || null}
                                        onChange={(value, option) => {
                                            setData('employee_profile_id', value ? String(value) : '');
                                            setSelectedEmployee(option ?? null);
                                        }}
                                        placeholder="Search employees…"
                                        renderOption={(option) => (
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-medium">{option.label}</span>
                                                <span className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.16em] uppercase">
                                                    {option.job_title ?? 'Untitled'} · {option.department ?? 'No dept'}
                                                    {option.has_approving_manager ? '' : ' · ⚠ no approver'}
                                                </span>
                                            </div>
                                        )}
                                    />
                                </FieldShell>

                                {/* Template */}
                                <FieldShell
                                    label="Template"
                                    icon={ClipboardList}
                                    error={errors.template_id}
                                    hint={
                                        selectedTemplate
                                            ? `${selectedTemplate.business_weight_percent}% Business · ${selectedTemplate.values_weight_percent}% Values`
                                            : 'Search active templates'
                                    }
                                >
                                    <AsyncSearchSelect<TemplateOption>
                                        endpoint={route('performance.appraisals.lookup.templates')}
                                        value={data.template_id || null}
                                        onChange={(value, option) => {
                                            setData('template_id', value ? String(value) : '');
                                            setSelectedTemplate(option ?? null);
                                        }}
                                        placeholder="Search templates…"
                                        renderOption={(option) => (
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-medium">{option.label}</span>
                                                <span className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.16em] uppercase">
                                                    {option.code} · {option.business_weight_percent}% biz ·{' '}
                                                    {option.values_weight_percent}% values · {option.min_objectives}–
                                                    {option.max_objectives} goals
                                                </span>
                                            </div>
                                        )}
                                    />
                                </FieldShell>
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-muted-foreground flex items-start gap-3 text-sm">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>
                                        Creating this appraisal will register a manual assignment for the selected
                                        cycle, employee, and template. The employee must already have an approving
                                        manager set.
                                    </p>
                                </div>

                                <Button type="submit" size="lg" disabled={!canSubmit}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {processing ? 'Creating…' : 'Create Appraisal'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* ===================================================== Selection summary panels */}
                <div className="grid gap-4 lg:grid-cols-12">
                    {/* Employee detail */}
                    <div className="lg:col-span-8">
                        <EmployeeDetailPanel
                            employeeId={data.employee_profile_id}
                            detail={detail}
                            loading={detailLoading}
                        />
                    </div>

                    {/* Cycle + template summary */}
                    <div className="space-y-4 lg:col-span-4">
                        <SummaryCard
                            icon={Layers3}
                            title="Review Cycle"
                            primary={selectedCycle?.label ?? 'Not selected'}
                            rows={
                                selectedCycle
                                    ? [
                                          ['Code', selectedCycle.code],
                                          ['Status', selectedCycle.status ?? '—'],
                                          ['Window', `${selectedCycle.start_date ?? '—'} → ${selectedCycle.end_date ?? '—'}`],
                                      ]
                                    : []
                            }
                        />
                        <SummaryCard
                            icon={FileText}
                            title="Template"
                            primary={selectedTemplate?.label ?? 'Not selected'}
                            rows={
                                selectedTemplate
                                    ? [
                                          ['Code', selectedTemplate.code],
                                          ['Business weight', `${selectedTemplate.business_weight_percent}%`],
                                          ['Values weight', `${selectedTemplate.values_weight_percent}%`],
                                          [
                                              'Goal range',
                                              `${selectedTemplate.min_objectives}–${selectedTemplate.max_objectives}`,
                                          ],
                                      ]
                                    : []
                            }
                        />
                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}

/* ====================================================================== */
/* Helpers                                                                 */
/* ====================================================================== */

interface FieldShellProps {
    label: string;
    icon: React.ElementType;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}

function FieldShell({ label, icon: Icon, error, hint, children }: FieldShellProps) {
    return (
        <div className="space-y-2">
            <div className="font-mono-brand text-muted-foreground flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase">
                <Icon className="h-3 w-3" />
                {label}
            </div>
            {children}
            {error ? (
                <p className="text-destructive text-[12px]">{error}</p>
            ) : hint ? (
                <p className="text-muted-foreground/80 truncate text-[11px]">{hint}</p>
            ) : null}
        </div>
    );
}

interface SummaryCardProps {
    icon: React.ElementType;
    title: string;
    primary: string;
    rows: Array<[string, string]>;
}

function SummaryCard({ icon: Icon, title, primary, rows }: SummaryCardProps) {
    return (
        <Card className="shadow-sm">
            <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                    <div className="bg-foreground/5 text-foreground flex h-8 w-8 items-center justify-center rounded-md">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                        {title}
                    </div>
                </div>
                <div className="text-foreground font-display text-xl leading-snug">{primary}</div>
                {rows.length > 0 ? (
                    <ul className="border-foreground/8 space-y-1 border-t pt-3">
                        {rows.map(([k, v]) => (
                            <li key={k} className="flex items-center justify-between text-[12px]">
                                <span className="text-muted-foreground">{k}</span>
                                <span className="text-foreground font-medium">{v}</span>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </CardContent>
        </Card>
    );
}

/* ====================================================================== */
/* Employee detail panel                                                   */
/* ====================================================================== */

interface EmployeeDetailPanelProps {
    employeeId: string;
    detail: EmployeeDetailResponse | null;
    loading: boolean;
}

function EmployeeDetailPanel({ employeeId, detail, loading }: EmployeeDetailPanelProps) {
    if (!employeeId) {
        return (
            <Card className="shadow-sm">
                <CardContent className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-3 p-8 text-center text-sm">
                    <div className="bg-secondary/30 text-foreground/70 flex h-12 w-12 items-center justify-center rounded-full">
                        <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                        Pick an employee above — their profile, manager, and recent appraisal will show up here.
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading && !detail) {
        return (
            <Card className="shadow-sm">
                <CardContent className="text-muted-foreground p-8 text-sm">Loading employee details…</CardContent>
            </Card>
        );
    }

    if (!detail) {
        return (
            <Card className="shadow-sm">
                <CardContent className="text-muted-foreground p-8 text-sm">
                    Couldn't load employee details.
                </CardContent>
            </Card>
        );
    }

    const { profile, latest_appraisal, appraisal_count } = detail;

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                            § Selected employee
                        </div>
                        <CardTitle className="font-display mt-2 text-2xl font-light tracking-tight">
                            {profile.name ?? 'Unknown employee'}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2 text-[13px]">
                            <span className="font-mono-brand">{profile.employee_number}</span>
                            <span>·</span>
                            <span>{profile.job_title ?? 'No job title'}</span>
                            <span>·</span>
                            <span>{profile.department ?? 'No department'}</span>
                        </CardDescription>
                    </div>
                    {profile.has_approving_manager ? (
                        <Badge variant="secondary" className="gap-1.5">
                            <CheckCircle2 className="h-3 w-3" />
                            Ready
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="gap-1.5">
                            <AlertTriangle className="h-3 w-3" />
                            Missing approver
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <DetailRow icon={Mail} label="Email" value={profile.email ?? '—'} />
                    <DetailRow icon={Briefcase} label="Employment" value={`${profile.employment_status ?? '—'} · ${profile.employment_type ?? '—'}`} />
                    <DetailRow icon={MapPin} label="Work location" value={profile.work_location ?? '—'} />
                    <DetailRow icon={CalendarClock} label="Hired" value={profile.hire_date ?? '—'} />
                    <DetailRow icon={Building2} label="Line manager" value={profile.line_manager ?? '—'} />
                    <DetailRow
                        icon={ShieldCheck}
                        label="Approving manager"
                        value={profile.approving_manager ?? 'Not set'}
                        tone={profile.has_approving_manager ? undefined : 'danger'}
                    />
                </div>

                <Separator className="my-6" />

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-muted/15 p-4">
                        <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                            Appraisal history
                        </div>
                        <div className="font-display mt-2 text-3xl leading-none">{appraisal_count}</div>
                        <div className="text-muted-foreground mt-1 text-[12px]">total appraisals on record</div>
                    </div>
                    <div className="rounded-lg border bg-muted/15 p-4">
                        <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                            Latest appraisal
                        </div>
                        {latest_appraisal ? (
                            <>
                                <div className="text-foreground mt-2 text-sm font-medium">{latest_appraisal.cycle_name}</div>
                                <div className="text-muted-foreground mt-1 text-[12px]">
                                    {latest_appraisal.template_name} · {latest_appraisal.status}
                                </div>
                            </>
                        ) : (
                            <div className="text-muted-foreground mt-2 text-[13px]">No prior appraisal.</div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface DetailRowProps {
    icon: React.ElementType;
    label: string;
    value: string;
    tone?: 'danger';
}

function DetailRow({ icon: Icon, label, value, tone }: DetailRowProps) {
    return (
        <div className="flex items-start gap-3">
            <div
                className={
                    tone === 'danger'
                        ? 'bg-destructive/10 text-destructive flex h-9 w-9 shrink-0 items-center justify-center rounded-md'
                        : 'bg-foreground/5 text-foreground/80 flex h-9 w-9 shrink-0 items-center justify-center rounded-md'
                }
            >
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                    {label}
                </div>
                <div className="text-foreground mt-0.5 text-[13px]">{value}</div>
            </div>
        </div>
    );
}

/* ====================================================================== */
/* Bulk-assign dialog                                                      */
/* ====================================================================== */

interface BulkAssignDialogProps {
    onClose: () => void;
}

function BulkAssignDialog({ onClose }: BulkAssignDialogProps) {
    const [cycleId, setCycleId] = React.useState<number | null>(null);
    const [templateId, setTemplateId] = React.useState<number | null>(null);
    const [cycleOption, setCycleOption] = React.useState<CycleOption | null>(null);
    const [templateOption, setTemplateOption] = React.useState<TemplateOption | null>(null);
    const [employees, setEmployees] = React.useState<EmployeeOption[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

    const excludeIds = employees.map((e) => Number(e.value)).join(',');
    const employeeExcludeQuery = React.useMemo(
        () => (excludeIds ? { exclude: excludeIds } : undefined),
        [excludeIds],
    );

    const removeEmployee = (id: number | string) => {
        setEmployees((current) => current.filter((e) => e.value !== id));
    };

    const canSubmit = cycleId && templateId && employees.length > 0 && !submitting;

    const submit = () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);

        router.post(
            route('performance.appraisals.bulk_store'),
            {
                review_cycle_id: cycleId,
                template_id: templateId,
                employee_profile_ids: employees.map((e) => Number(e.value)),
            },
            {
                preserveScroll: true,
                onError: (errs) => {
                    const first = Object.values(errs)[0];
                    setError(typeof first === 'string' ? first : 'Could not create appraisals.');
                    setSubmitting(false);
                },
                onSuccess: () => {
                    setSubmitting(false);
                    onClose();
                },
            },
        );
    };

    const missingApprover = employees.filter((e) => !e.has_approving_manager);

    const keepPopoverOpen = (event: Event) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('[data-radix-popover-content]')) {
            event.preventDefault();
        }
    };

    return (
        <DialogContent
            className="flex max-h-[min(90vh,920px)] w-[min(96vw,64rem)] max-w-none flex-col gap-5 overflow-visible sm:max-w-none"
            onInteractOutside={keepPopoverOpen}
            onFocusOutside={keepPopoverOpen}
            onPointerDownOutside={keepPopoverOpen}
        >
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-brand-sand/20 text-brand-ink flex h-10 w-10 items-center justify-center rounded-md">
                        <Wand2 className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                            § Bulk assignment
                        </div>
                        <DialogTitle className="font-display mt-1 text-2xl font-light tracking-tight">
                            Assign to many
                        </DialogTitle>
                    </div>
                </div>
                <DialogDescription>
                    Pick one cycle and template, then add as many employees as you need. Each employee receives their own
                    appraisal record — duplicates are skipped automatically.
                </DialogDescription>
            </DialogHeader>

            <div ref={setPortalContainer} className="space-y-5">
                {/* Cycle + template */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                            Review Cycle
                        </label>
                        <AsyncSearchSelect<CycleOption>
                            endpoint={route('performance.appraisals.lookup.cycles')}
                            value={cycleId}
                            className="w-full"
                            portalContainer={portalContainer}
                            onChange={(value, option) => {
                                setCycleId(value != null ? Number(value) : null);
                                setCycleOption(option ?? null);
                            }}
                            placeholder="Search cycles…"
                            renderOption={(option) => (
                                <div className="flex flex-col">
                                    <span className="text-foreground font-medium">{option.label}</span>
                                    <span className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.16em] uppercase">
                                        {option.code} · {option.status ?? 'unknown'}
                                    </span>
                                </div>
                            )}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                            Template
                        </label>
                        <AsyncSearchSelect<TemplateOption>
                            endpoint={route('performance.appraisals.lookup.templates')}
                            value={templateId}
                            className="w-full"
                            portalContainer={portalContainer}
                            onChange={(value, option) => {
                                setTemplateId(value != null ? Number(value) : null);
                                setTemplateOption(option ?? null);
                            }}
                            placeholder="Search templates…"
                            renderOption={(option) => (
                                <div className="flex flex-col">
                                    <span className="text-foreground font-medium">{option.label}</span>
                                    <span className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.16em] uppercase">
                                        {option.business_weight_percent}% biz · {option.values_weight_percent}% values
                                    </span>
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* Add employee */}
                <div className="space-y-1.5">
                    <label className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                        Add employees
                    </label>
                    <AsyncSearchSelect<EmployeeOption>
                        endpoint={route('performance.appraisals.lookup.employees')}
                        value={null}
                        className="w-full"
                        nonClearable
                        portalContainer={portalContainer}
                        extraQuery={employeeExcludeQuery}
                        onChange={(_, option) => {
                            if (option) {
                                setEmployees((current) =>
                                    current.find((e) => e.value === option.value) ? current : [...current, option],
                                );
                            }
                        }}
                        placeholder="Search by name, email, number, department…"
                        renderOption={(option) => (
                            <div className="flex flex-col">
                                <span className="text-foreground font-medium">{option.label}</span>
                                <span className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.16em] uppercase">
                                    {option.job_title ?? 'Untitled'} · {option.department ?? 'No dept'}
                                </span>
                            </div>
                        )}
                    />
                </div>

                {/* Selected employees */}
                {employees.length > 0 ? (
                    <div className="border-foreground/10 max-h-64 space-y-1 overflow-y-auto rounded-md border bg-muted/10 p-2">
                        {employees.map((e) => (
                            <div
                                key={e.value}
                                className="bg-background border-foreground/8 flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                            >
                                <div className="min-w-0">
                                    <div className="text-foreground truncate text-[13px] font-medium">{e.label}</div>
                                    <div className="text-muted-foreground font-mono-brand truncate text-[10px] tracking-[0.16em] uppercase">
                                        {e.job_title ?? 'Untitled'} · {e.department ?? 'No dept'}
                                        {e.has_approving_manager ? '' : ' · ⚠ no approver'}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeEmployee(e.value)}
                                    className="hover:bg-destructive/10 hover:text-destructive grid h-7 w-7 place-items-center rounded-md transition-colors"
                                    aria-label={`Remove ${e.label}`}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}

                {/* Warning for missing approvers */}
                {missingApprover.length > 0 ? (
                    <div className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-[12px]">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                            {missingApprover.length} employee{missingApprover.length === 1 ? '' : 's'} missing an
                            approving manager — assignment will fail until those are set on their profile.
                        </span>
                    </div>
                ) : null}

                {error ? (
                    <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-[12px]">
                        {error}
                    </div>
                ) : null}

                {/* Summary */}
                <div className="border-foreground/10 grid grid-cols-3 gap-3 rounded-md border bg-muted/10 p-3 text-[12px]">
                    <div>
                        <div className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.18em] uppercase">
                            Cycle
                        </div>
                        <div className="text-foreground mt-1 truncate font-medium">
                            {cycleOption?.label ?? '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.18em] uppercase">
                            Template
                        </div>
                        <div className="text-foreground mt-1 truncate font-medium">
                            {templateOption?.label ?? '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground font-mono-brand text-[10px] tracking-[0.18em] uppercase">
                            Employees
                        </div>
                        <div className="text-foreground mt-1 font-medium">{employees.length}</div>
                    </div>
                </div>
            </div>

            <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="button" disabled={!canSubmit} onClick={submit}>
                    <Plus className="mr-2 h-4 w-4" />
                    {submitting
                        ? 'Assigning…'
                        : `Create ${employees.length} appraisal${employees.length === 1 ? '' : 's'}`}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
