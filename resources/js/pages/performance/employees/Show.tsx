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
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatDate } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type {
    EmployeeFieldConfigItem,
    EmployeePeerComparison,
    EmployeePerformanceTrend,
    EmployeeProfile,
    Option,
    PerformanceTrendStatus,
} from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import {
    Briefcase,
    CalendarDays,
    Contact,
    Eye,
    History,
    Mail,
    Minus,
    PencilLine,
    PieChart,
    ShieldCheck,
    TrendingDown,
    TrendingUp,
    User2,
    UserCog,
    UserRoundCog,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

const adminBreadcrumbs = (profile: EmployeeProfile): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Employees', href: route('performance.employees.index') },
    { title: profile.user?.name ?? profile.employee_number, href: route('performance.employees.show', profile.id) },
];

const ownProfileBreadcrumbs = (profile: EmployeeProfile): BreadcrumbItem[] => [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Profile', href: route('performance.profile.show') },
    { title: profile.user?.name ?? profile.employee_number, href: route('performance.profile.show') },
];

export default function EmployeeShow({
    employeeProfile,
    managerOptions,
    fieldConfig,
    performanceTrend,
    peerComparison = null,
    isOwnProfile = false,
    can,
}: {
    employeeProfile: EmployeeProfile;
    managerOptions: Option[];
    fieldConfig: EmployeeFieldConfigItem[];
    performanceTrend?: EmployeePerformanceTrend;
    peerComparison?: EmployeePeerComparison | null;
    isOwnProfile?: boolean;
    can: { assignManagers: boolean; edit?: boolean };
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

    const breadcrumbs = isOwnProfile ? ownProfileBreadcrumbs(employeeProfile) : adminBreadcrumbs(employeeProfile);
    const editHref = isOwnProfile
        ? route('performance.profile.edit')
        : route('performance.employees.edit', employeeProfile.id);

    return (
        <PerformancePage
            title={userName}
            description={
                isOwnProfile
                    ? 'Your employee profile, reporting lines, and appraisal history.'
                    : 'Employee profile, reporting lines, role assignments, and appraisal history.'
            }
            breadcrumbs={breadcrumbs}
            secondaryActions={
                can.edit ? (
                    <Button asChild variant="outline">
                        <Link href={editHref}>
                            <PencilLine className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Link>
                    </Button>
                ) : undefined
            }
        >
            <div className="space-y-6">
                {/* Editorial header — matches welcome / dashboard typography */}
                <div className="bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm lg:p-8">
                    <div className="bg-brand-sand/12 absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-5">
                            <div className="bg-secondary/40 text-foreground font-display flex h-20 w-20 items-center justify-center rounded-xl border text-2xl font-light">
                                {getInitials(userName)}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="font-mono-brand text-foreground/60 flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase">
                                        <span className="bg-brand-sand inline-block h-px w-6" />
                                        <span>{isOwnProfile ? '§ My profile' : '§ Employee profile'}</span>
                                    </div>
                                    <h1 className="font-display text-balance text-foreground mt-3 text-4xl leading-[1] font-light tracking-tight lg:text-5xl">
                                        {userName}
                                    </h1>
                                    <p className="text-foreground/70 mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                                        <Badge variant="secondary">{employeeProfile.employee_number}</Badge>
                                        <span>{employeeProfile.job_title?.name ?? 'No job title'}</span>
                                        <span className="text-foreground/30">·</span>
                                        <span>{employeeProfile.department?.name ?? 'No department'}</span>
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
                                <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    § Operational status
                                </div>
                                <CardTitle className="font-display mt-1 text-lg font-light tracking-tight">
                                    At a glance
                                </CardTitle>
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
                                    <div className="font-mono-brand text-muted-foreground mb-2 text-[10px] tracking-[0.22em] uppercase">
                                        Internal Notes
                                    </div>
                                    <p className="text-muted-foreground text-[13px] leading-6">
                                        {employeeProfile.notes ?? 'No employee notes recorded.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                            <UserCog className="h-3.5 w-3.5" />
                                            § Reporting line
                                        </div>
                                        <CardTitle className="font-display mt-1 text-lg font-light tracking-tight">
                                            Managers
                                        </CardTitle>
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
                                                    <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                        § Reporting line
                                                    </div>
                                                    <DialogTitle className="font-display text-2xl font-light tracking-tight">
                                                        Assign Line Manager
                                                    </DialogTitle>
                                                    <DialogDescription className="text-[13px]">
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
                                    <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                        <History className="h-3.5 w-3.5" />
                                        § Appraisal history
                                    </div>
                                    <CardTitle className="font-display mt-1 text-2xl font-light tracking-tight">
                                        Cycles & performance
                                    </CardTitle>
                                    <CardDescription className="text-[13px]">
                                        Cycle history and current performance workflow state.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {performanceTrend && performanceTrend.points.length > 0 ? (
                                        <PerformanceTrendPanel trend={performanceTrend} peerComparison={peerComparison} />
                                    ) : null}

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
                                                        <div className="font-display text-foreground text-lg font-light">
                                                            {appraisal.cycle_name_snapshot}
                                                        </div>
                                                        <div className="font-mono-brand text-muted-foreground mt-1 text-[10px] tracking-[0.22em] uppercase">
                                                            Status · {formatValue(appraisal.status)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                            Performance score
                                                        </div>
                                                        <div className="font-display text-foreground mt-1 text-lg leading-none font-light">
                                                            {effectiveAppraisalScore(appraisal) !== null
                                                                ? `${effectiveAppraisalScore(appraisal)!.toFixed(1)}%`
                                                                : '—'}
                                                        </div>
                                                    </div>
                                                    <ScoreDonut score={effectiveAppraisalScore(appraisal)} />
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
                                        <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                            {section === 'identity' ? <User2 className="h-3.5 w-3.5" /> : null}
                                            {section === 'contact' ? <Contact className="h-3.5 w-3.5" /> : null}
                                            {section === 'employment' ? <Briefcase className="h-3.5 w-3.5" /> : null}
                                            {section === 'performance' ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
                                            {section === 'notes' ? <Eye className="h-3.5 w-3.5" /> : null}
                                            § {formatValue(section)}
                                        </div>
                                        <CardTitle className="font-display mt-1 text-xl font-light tracking-tight">
                                            {formatValue(section)} details
                                        </CardTitle>
                                        <CardDescription className="text-[12px]">
                                            Configured employee fields for this section.
                                        </CardDescription>
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
                                        <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                            <Users className="h-3.5 w-3.5" />
                                            § Access
                                        </div>
                                        <CardTitle className="font-display mt-1 text-xl font-light tracking-tight">
                                            Role assignments
                                        </CardTitle>
                                        <CardDescription className="text-[12px]">
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
                                        <div className="font-mono-brand text-muted-foreground flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase">
                                            <Mail className="h-3.5 w-3.5" />
                                            § Account
                                        </div>
                                        <CardTitle className="font-display mt-1 text-xl font-light tracking-tight">
                                            Linked account
                                        </CardTitle>
                                        <CardDescription className="text-[12px]">
                                            Connected user identity and access reference.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                User email
                                            </div>
                                            <div className="text-foreground mt-2 text-[13px] font-medium">
                                                {employeeProfile.user?.email ?? '—'}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                                Employee record
                                            </div>
                                            <div className="text-foreground mt-2 text-[13px] font-medium">
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

function effectiveAppraisalScore(appraisal: NonNullable<EmployeeProfile['appraisals']>[number]) {
    const score = appraisal.calibrated_overall_score ?? appraisal.overall_score;

    return score === null || score === undefined ? null : Number(score);
}

const trendChartConfig = {
    score: { label: 'Effective score', theme: { light: 'var(--chart-1)', dark: 'var(--chart-1)' } },
} satisfies ChartConfig;

function PerformanceTrendPanel({
    trend,
    peerComparison,
}: {
    trend: EmployeePerformanceTrend;
    peerComparison: EmployeePeerComparison | null;
}) {
    const chartData = useMemo(
        () =>
            trend.points.map((point) => ({
                cycle: point.cycle_name,
                score: point.score,
            })),
        [trend.points],
    );

    return (
        <div className="space-y-5 rounded-xl border bg-muted/10 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                        § Performance trend
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <TrendStatusBadge status={trend.trend_status} label={trend.trend_label} />
                        {trend.score_delta !== null ? (
                            <span className="text-muted-foreground text-sm">
                                {trend.previous_cycle_name ?? 'Previous'} → {trend.current_cycle_name ?? 'Current'}:{' '}
                                <span className="text-foreground font-medium">{formatTrendDelta(trend.score_delta)}</span>
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                    <TrendMetric label="Previous" value={trend.previous_score} />
                    <TrendMetric label="Current" value={trend.latest_score} />
                    <TrendMetric label="Delta" value={trend.score_delta} signed />
                </div>
            </div>

            {chartData.length >= 2 ? (
                <ChartContainer config={trendChartConfig} className="h-[220px] w-full">
                    <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="cycle" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
                        <ChartTooltip cursor={false} content={(props) => <ChartTooltipContent {...props} />} />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="var(--color-score)"
                            strokeWidth={2}
                            dot={{ r: 4, fill: 'var(--color-score)' }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ChartContainer>
            ) : (
                <p className="text-muted-foreground text-sm">
                    At least two finalized scored cycles are required to plot movement over time.
                </p>
            )}

            {peerComparison ? (
                <div className="space-y-3 border-t pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                § Same scorecard peers
                            </div>
                            <p className="text-foreground mt-1 text-sm font-medium">{peerComparison.template_name}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Rank {peerComparison.cohort_rank} of {peerComparison.cohort_size}</Badge>
                            <Badge variant="outline">Cohort avg {peerComparison.cohort_average.toFixed(1)}%</Badge>
                            <Badge variant="outline">
                                Gap {formatTrendDelta(peerComparison.gap_from_cohort_average)}
                            </Badge>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/30">
                                <tr>
                                    {['Employee', 'Job title', 'Score'].map((header) => (
                                        <th
                                            key={header}
                                            className="px-4 py-3 text-left text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {peerComparison.peers.slice(0, 5).map((peer) => (
                                    <tr key={peer.employee_profile_id} className="border-t">
                                        <td className="px-4 py-3 font-medium">{peer.employee_name}</td>
                                        <td className="text-muted-foreground px-4 py-3">{peer.job_title ?? '—'}</td>
                                        <td className="text-muted-foreground px-4 py-3">{peer.current_score.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function TrendStatusBadge({ status, label }: { status: PerformanceTrendStatus; label: string }) {
    const className =
        status === 'improving'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : status === 'declining'
              ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
              : status === 'stable'
                ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : 'border-muted-foreground/30 bg-muted/20 text-muted-foreground';

    const Icon = status === 'improving' ? TrendingUp : status === 'declining' ? TrendingDown : Minus;

    return (
        <Badge variant="outline" className={className}>
            <Icon className="mr-1.5 h-3.5 w-3.5" />
            {label}
        </Badge>
    );
}

function TrendMetric({ label, value, signed = false }: { label: string; value: number | null; signed?: boolean }) {
    return (
        <div className="rounded-lg border bg-background px-3 py-2">
            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">{label}</div>
            <div className="font-display text-foreground mt-1 text-lg font-light">
                {value === null ? '—' : signed ? formatTrendDelta(value) : `${value.toFixed(1)}%`}
            </div>
        </div>
    );
}

function formatTrendDelta(value: number) {
    if (value === 0) {
        return '0.0';
    }

    return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
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
        <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">{label}</div>
            <div className="font-display text-foreground mt-1 text-lg font-light tracking-tight">{value}</div>
        </div>
    );
}

function KeyValueBadge({ label, value, active }: { label: string; value: string; active: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <span className="text-foreground/70 text-[13px]">{label}</span>
            <Badge variant={active ? 'secondary' : 'outline'}>{value}</Badge>
        </div>
    );
}

function MiniPersonCard({ label, name }: { label: string; name: string }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="bg-background text-foreground font-display flex h-9 w-9 items-center justify-center rounded-full border text-xs font-medium">
                {getInitials(name)}
            </div>
            <div>
                <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                    {label}
                </div>
                <div className="font-display text-foreground text-[15px] leading-tight font-light">{name}</div>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border bg-muted/10 p-4">
            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">{label}</div>
            <div className="font-display text-foreground mt-2 text-base font-light tracking-tight">{value}</div>
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
