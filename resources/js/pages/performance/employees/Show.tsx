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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeFieldConfigItem, EmployeeProfile, Option } from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import {
    Briefcase,
    CalendarDays,
    Contact,
    Eye,
    History,
    Mail,
    PencilLine,
    PieChart,
    ShieldCheck,
    User2,
    UserCog,
    UserRoundCog,
    Users,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs = (profile: EmployeeProfile): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
    { title: profile.user?.name ?? profile.employee_number, href: route('performance.employees.show', profile.id) },
];

export default function EmployeeShow({
    employeeProfile,
    managerOptions,
    fieldConfig,
    can,
}: {
    employeeProfile: EmployeeProfile;
    managerOptions: Option[];
    fieldConfig: EmployeeFieldConfigItem[];
    can: { assignManagers: boolean };
}) {
    const [lineManagerModalOpen, setLineManagerModalOpen] = useState(false);
    const managerForm = useForm({
        line_manager_user_id: employeeProfile.line_manager_user_id ? String(employeeProfile.line_manager_user_id) : 'none',
    });

    const userName = employeeProfile.user?.name ?? employeeProfile.employee_number;
    const roles = employeeProfile.user?.roles ?? [];
    const appraisals = employeeProfile.appraisals ?? [];
    const visibleFields = fieldConfig.filter((field) => field.enabled);
    const showLinkedAccount = visibleFields.some((field) => field.field_key === 'linked_account');
    const showAppraisalHistory = visibleFields.some((field) => field.field_key === 'appraisal_history');
    const detailSections = (['identity', 'contact', 'employment', 'performance', 'notes'] as const)
        .map((section) => ({
            section,
            fields: visibleFields.filter(
                (field) =>
                    field.section === section &&
                    !['display', 'score', 'history', 'linked_account'].includes(field.input_type),
            ),
        }))
        .filter((section) => section.fields.length > 0);

    return (
        <PerformancePage
            title={userName}
            description="Employee profile, reporting lines, role assignments, and appraisal history."
            breadcrumbs={breadcrumbs(employeeProfile)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.employees.edit', employeeProfile.id)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-xl border bg-muted/30 text-xl font-semibold text-foreground">
                                {getInitials(userName)}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{userName}</h1>
                                        <Badge variant="secondary">{employeeProfile.employee_number}</Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        {employeeProfile.job_title?.name ?? 'No job title'} {' • '}
                                        {employeeProfile.department?.name ?? 'No department'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {roles.length > 0 ? (
                                        roles.map((role) => (
                                            <Badge key={role.id} variant="outline">
                                                {role.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant="outline">No roles assigned</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <StatusPill
                                label="Active Status"
                                value={employeeProfile.is_active ? 'Active' : 'Inactive'}
                            />
                            <StatusPill
                                label="Review Status"
                                value={(employeeProfile.is_review_eligible ?? true) ? 'Review Eligible' : 'Not Review Eligible'}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ShieldCheck className="h-4.5 w-4.5" />
                                    <CardTitle className="text-sm font-medium">Operational Status</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <KeyValueBadge
                                    label="Active Status"
                                    value={employeeProfile.is_active ? 'Active' : 'Inactive'}
                                    active={employeeProfile.is_active}
                                />
                                <KeyValueBadge
                                    label="Review Eligibility"
                                    value={(employeeProfile.is_review_eligible ?? true) ? 'Eligible' : 'Not Eligible'}
                                    active={employeeProfile.is_review_eligible ?? true}
                                />
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        Internal Notes
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        {employeeProfile.notes ?? 'No employee notes recorded.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <UserCog className="h-4.5 w-4.5" />
                                        <CardTitle className="text-sm font-medium">Reporting Line</CardTitle>
                                    </div>

                                    {can.assignManagers ? (
                                        <Dialog open={lineManagerModalOpen} onOpenChange={setLineManagerModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button type="button" variant="outline" size="sm">
                                                    <UserRoundCog className="mr-2 h-4 w-4" />
                                                    Assign Line Manager
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Assign Line Manager</DialogTitle>
                                                    <DialogDescription>
                                                        Select a line manager for {userName}. This updates reporting and appraisal routing.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-2">
                                                    <Label htmlFor="line-manager-select">Line Manager</Label>
                                                    <Select
                                                        value={managerForm.data.line_manager_user_id}
                                                        onValueChange={(value) => managerForm.setData('line_manager_user_id', value)}
                                                    >
                                                        <SelectTrigger id="line-manager-select">
                                                            <SelectValue placeholder="Select line manager" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Unassign</SelectItem>
                                                            {managerOptions.map((option) => (
                                                                <SelectItem key={String(option.value)} value={String(option.value)}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        disabled={managerForm.processing}
                                                        onClick={() =>
                                                            managerForm
                                                                .transform((data) => ({
                                                                    ...data,
                                                                    line_manager_user_id:
                                                                        data.line_manager_user_id === 'none'
                                                                            ? null
                                                                            : data.line_manager_user_id,
                                                                }))
                                                                .patch(
                                                                    route('performance.employees.line_manager.update', employeeProfile.id),
                                                                    {
                                                                        preserveScroll: true,
                                                                        onSuccess: () => setLineManagerModalOpen(false),
                                                                    },
                                                                )
                                                        }
                                                    >
                                                        Save Manager
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    ) : null}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <MiniPersonCard
                                    label="Line Manager"
                                    name={employeeProfile.line_manager?.name ?? 'Not assigned'}
                                />
                                <MiniPersonCard
                                    label="Approving Manager"
                                    name={employeeProfile.approving_manager?.name ?? 'Not assigned'}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 lg:col-span-8">
                        {showAppraisalHistory ? (
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <History className="h-4.5 w-4.5" />
                                        <CardTitle className="text-base">Appraisal History</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Cycle history and current performance workflow state.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    {appraisals.length > 0 ? (
                                        appraisals.map((appraisal) => (
                                            <div
                                                key={appraisal.id}
                                                className="flex flex-col gap-4 rounded-xl border bg-muted/10 p-4 md:flex-row md:items-center md:justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                                                        <CalendarDays className="h-4.5 w-4.5" />
                                                    </div>

                                                    <div>
                                                        <div className="font-medium text-foreground">
                                                            {appraisal.cycle_name_snapshot}
                                                        </div>
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Status: {formatValue(appraisal.status)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                                            Performance Score
                                                        </div>
                                                        <div className="mt-1 text-sm font-semibold text-foreground">
                                                            {appraisal.overall_score !== undefined && appraisal.overall_score !== null
                                                                ? `${Number(appraisal.overall_score).toFixed(1)}%`
                                                                : '-'}
                                                        </div>
                                                    </div>
                                                    <ScoreDonut score={appraisal.overall_score} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No appraisal history recorded yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        ) : null}

                        <div className="grid gap-6 md:grid-cols-2">
                            {detailSections.map(({ section, fields }) => (
                                <Card key={section} className="shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {section === 'identity' ? <User2 className="h-4.5 w-4.5" /> : null}
                                            {section === 'contact' ? <Contact className="h-4.5 w-4.5" /> : null}
                                            {section === 'employment' ? <Briefcase className="h-4.5 w-4.5" /> : null}
                                            {section === 'performance' ? <ShieldCheck className="h-4.5 w-4.5" /> : null}
                                            {section === 'notes' ? <Eye className="h-4.5 w-4.5" /> : null}
                                            <CardTitle className="text-base">{formatValue(section)}</CardTitle>
                                        </div>
                                        <CardDescription>Configured employee fields for this section.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        {fields.map((field) => (
                                            <Info
                                                key={field.field_key}
                                                label={field.label}
                                                value={formatShowField(employeeProfile, field)}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {showLinkedAccount ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="h-4.5 w-4.5" />
                                            <CardTitle className="text-base">Role Assignments</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Current application roles from the linked user account.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        {roles.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {roles.map((role) => (
                                                    <Badge key={role.id} variant="outline">
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No roles assigned.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="h-4.5 w-4.5" />
                                            <CardTitle className="text-base">Linked Account</CardTitle>
                                        </div>
                                        <CardDescription>Connected user identity and access reference.</CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">User Email</div>
                                            <div className="mt-2 text-sm font-medium text-foreground">
                                                {employeeProfile.user?.email ?? '-'}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="text-xs uppercase tracking-wide text-muted-foreground">Employee Record</div>
                                            <div className="mt-2 text-sm font-medium text-foreground">
                                                {employeeProfile.employee_number}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}

function formatShowField(profile: EmployeeProfile, field: EmployeeFieldConfigItem) {
    switch (field.field_key) {
        case 'user_name':
            return profile.user?.name ?? '-';
        case 'user_email':
            return profile.user?.email ?? '-';
        case 'employee_number':
            return profile.employee_number;
        case 'national_id':
            return maskNationalId(profile.national_id);
        case 'date_of_birth':
            return formatDate(profile.date_of_birth, '-');
        case 'gender':
        case 'marital_status':
        case 'employment_type':
            return formatValue(profile[field.field_key as keyof EmployeeProfile] as string | null | undefined);
        case 'department_id':
            return profile.department?.name ?? '-';
        case 'job_title_id':
            return profile.job_title?.name ?? '-';
        case 'employment_status':
            return formatValue(profile.employment_status);
        case 'work_location':
            return profile.work_location ?? '-';
        case 'hire_date':
        case 'probation_end_date':
        case 'confirmation_date':
        case 'review_eligibility_date':
            return formatDate(profile[field.field_key as keyof EmployeeProfile] as string | null | undefined, '-');
        case 'line_manager_user_id':
            return profile.line_manager?.name ?? '-';
        case 'approving_manager_user_id':
            return profile.approving_manager?.name ?? '-';
        case 'is_review_eligible':
            return (profile.is_review_eligible ?? true) ? 'Yes' : 'No';
        case 'is_active':
            return profile.is_active ? 'Yes' : 'No';
        case 'notes':
            return profile.notes ?? '-';
        case 'personal_phone':
            return profile.personal_phone ?? '-';
        case 'emergency_contact_name':
            return profile.emergency_contact_name ?? '-';
        case 'emergency_contact_phone':
            return profile.emergency_contact_phone ?? '-';
        case 'home_address_line_1':
            return profile.home_address_line_1 ?? '-';
        case 'home_address_line_2':
            return profile.home_address_line_2 ?? '-';
        case 'city':
            return profile.city ?? '-';
        case 'state_province':
            return profile.state_province ?? '-';
        case 'postal_code':
            return profile.postal_code ?? '-';
        case 'country':
            return profile.country ?? '-';
        case 'latest_overall_score':
            return profile.latest_appraisal?.overall_score !== null && profile.latest_appraisal?.overall_score !== undefined
                ? `${Number(profile.latest_appraisal.overall_score).toFixed(1)}%`
                : '-';
        default:
            return '-';
    }
}

function StatusPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 font-semibold text-foreground">{value}</div>
        </div>
    );
}

function KeyValueBadge({ label, value, active }: { label: string; value: string; active: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Badge variant={active ? 'secondary' : 'outline'}>{value}</Badge>
        </div>
    );
}

function MiniPersonCard({ label, name }: { label: string; name: string }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-xs font-semibold text-foreground">
                {getInitials(name)}
            </div>
            <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="text-sm font-medium text-foreground">{name}</div>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-base font-semibold text-foreground">{value}</div>
        </div>
    );
}

function formatValue(value?: string | null) {
    if (!value) return '-';

    return value
        .replace(/_/g, ' ')
        .split(' ')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(' ');
}

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
    if (value.length <= 4) return value;

    return `***-**-${value.slice(-4)}`;
}

function ScoreDonut({ score }: { score?: number | null }) {
    const numericScore = score === null || score === undefined ? null : Number(score);
    const normalized = numericScore === null || Number.isNaN(numericScore) ? null : Math.max(0, Math.min(100, numericScore));

    const colorClass =
        normalized === null
            ? 'var(--muted-foreground)'
            : normalized >= 80
              ? 'var(--chart-2)'
              : normalized >= 60
                ? 'var(--chart-4)'
                : 'var(--destructive)';

    return (
        <div className="relative h-12 w-12 shrink-0 rounded-full border border-border/60 bg-muted/20 p-1">
            <div
                className="h-full w-full rounded-full"
                style={{
                    background:
                        normalized === null
                            ? 'conic-gradient(var(--muted) 100%, transparent 0)'
                            : `conic-gradient(${colorClass} ${normalized}%, var(--muted) ${normalized}% 100%)`,
                }}
            />
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-background text-[10px] font-semibold text-foreground">
                {normalized === null ? <PieChart className="h-3 w-3 text-muted-foreground" /> : `${Math.round(normalized)}`}
            </div>
        </div>
    );
}
