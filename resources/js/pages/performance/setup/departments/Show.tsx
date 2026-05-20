import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Department, EmployeeProfile } from '@/types/performance';
import { Link } from '@inertiajs/react';
import { Activity, BarChart3, Building2, Eye, FileText, PencilLine, ShieldCheck, Sparkles, Users, Wrench } from 'lucide-react';

const breadcrumbs = (department: Department): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Departments', href: route('performance.setup.departments.index') },
    { title: department.name, href: route('performance.setup.departments.show', department.id) },
];

function getUsageHealth(department: Department) {
    const employees = department.employee_profiles_count ?? 0;
    const templates = department.appraisal_templates_count ?? 0;
    const goals = department.goal_library_items_count ?? 0;

    const total = employees + templates + goals;
    if (total >= 20) return 'High';
    if (total >= 8) return 'Moderate';
    return 'Emerging';
}

function effectiveScore(appraisal?: Appraisal | null) {
    return appraisal?.calibrated_overall_score ?? appraisal?.overall_score ?? null;
}

function effectiveRating(appraisal?: Appraisal | null) {
    return appraisal?.calibrated_overall_rating_level?.label ?? appraisal?.overall_rating_level?.label ?? 'Unrated';
}

function formatScore(score: number | string | null) {
    if (score === null) return 'No score';

    return `${Number(score).toFixed(1)}%`;
}

function labelize(value?: string | null) {
    if (!value) return 'Not set';

    return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DepartmentShow({ department }: { department: Department }) {
    const employees = department.employee_profiles_count ?? 0;
    const employeeProfiles = department.employee_profiles ?? [];
    const templates = department.appraisal_templates_count ?? 0;
    const goals = department.goal_library_items_count ?? 0;
    const usageHealth = getUsageHealth(department);

    return (
        <PerformancePage
            title={department.name}
            description="Department detail and usage summary."
            breadcrumbs={breadcrumbs(department)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.setup.departments.edit', department.id)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            {department.name}
                        </h1>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {department.code} | Department Registry
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('performance.setup.departments.edit', department.id)}>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Edit Department
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8">
                        <Card className="h-full shadow-sm">
                            <CardContent className="space-y-8 p-8">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge variant="outline" className="font-mono">
                                            {department.code}
                                        </Badge>

                                        <Badge variant={department.is_active ? 'secondary' : 'outline'}>
                                            {department.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Activity className="h-4 w-4" />
                                        Usage health: {usageHealth}
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3">
                                    <MetricCard
                                        label="Employees"
                                        value={employees}
                                        helper="Assigned profiles"
                                        icon={<Users className="h-4 w-4" />}
                                    />

                                    <MetricCard
                                        label="Templates"
                                        value={templates}
                                        helper="Linked frameworks"
                                        icon={<Wrench className="h-4 w-4" />}
                                    />

                                    <MetricCard
                                        label="Goal Library"
                                        value={goals}
                                        helper="Mapped goal items"
                                        icon={<BarChart3 className="h-4 w-4" />}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12 lg:col-span-4">
                        <Card className="h-full shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    Department Description
                                </CardTitle>
                                <CardDescription>
                                    Context for how this department is used in the appraisal system.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <p className="text-sm leading-7 text-muted-foreground">
                                    {department.description ?? 'No description provided.'}
                                </p>

                                <div className="border-t pt-6">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Classification Notes
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">Operational Unit</Badge>
                                        <Badge variant="outline">Performance Setup</Badge>
                                        <Badge variant="outline">Catalogued Department</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Users className="h-5 w-5 text-muted-foreground" />
                                            Department People
                                        </CardTitle>
                                        <CardDescription>
                                            Employees assigned to this department with latest appraisal outcome.
                                        </CardDescription>
                                    </div>

                                    <Badge variant="outline">{employeeProfiles.length} profile(s)</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {employeeProfiles.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-muted/30 text-left">
                                                <tr>
                                                    {['Employee', 'Job Title', 'Status', 'Location', 'Review', 'Score', 'Rating', ''].map((header) => (
                                                        <th key={header} className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {employeeProfiles.map((profile) => (
                                                    <DepartmentEmployeeRow key={profile.id} profile={profile} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex min-h-[220px] items-center justify-center border-t bg-muted/10 p-8 text-center text-sm text-muted-foreground">
                                        No employee profiles are assigned to this department yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12">
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.16em] text-muted-foreground">
                                        <span>Registry Summary</span>
                                        <Building2 className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <InfoRow label="Department Name" value={department.name} />
                                    <InfoRow label="Department Code" value={department.code} />
                                    <InfoRow
                                        label="Lifecycle"
                                        value={department.is_active ? 'Available for assignment' : 'Inactive in registry'}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.16em] text-muted-foreground">
                                        <span>Operational Reach</span>
                                        <Users className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <UsageRow label="Employee Profiles" value={employees} />
                                    <UsageRow label="Appraisal Templates" value={templates} />
                                    <UsageRow label="Goal Library Items" value={goals} />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.16em] text-muted-foreground">
                                        <span>Department Health</span>
                                        <Sparkles className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    <ProgressMetric
                                        label="Catalog Completeness"
                                        value={department.description ? 92 : 58}
                                    />
                                    <ProgressMetric
                                        label="Usage Coverage"
                                        value={Math.min((employees + templates + goals) * 8, 100)}
                                    />

                                    <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/10 p-3 text-xs text-muted-foreground">
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Department health insight generated from current usage data
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}

function DepartmentEmployeeRow({ profile }: { profile: EmployeeProfile }) {
    const appraisal = profile.latest_appraisal;
    const score = effectiveScore(appraisal);

    return (
        <tr className="border-t transition-colors hover:bg-muted/20 odd:bg-background even:bg-muted/[0.02]">
            <td className="px-4 py-4">
                <div className="font-semibold text-foreground">{profile.user?.name ?? 'Unassigned user'}</div>
                <div className="mt-1 text-xs text-muted-foreground">{profile.employee_number}</div>
            </td>
            <td className="px-4 py-4 text-muted-foreground">{profile.job_title?.name ?? 'No job title'}</td>
            <td className="px-4 py-4">
                <Badge variant={profile.is_active ? 'secondary' : 'outline'}>
                    {labelize(profile.employment_status)}
                </Badge>
            </td>
            <td className="px-4 py-4 text-muted-foreground">{profile.work_location ?? 'Not set'}</td>
            <td className="px-4 py-4">
                <div className="text-muted-foreground">{appraisal?.cycle_name_snapshot ?? 'No appraisal'}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                    {profile.is_review_eligible ? 'Review eligible' : 'Not review eligible'}
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="font-semibold text-foreground">{formatScore(score)}</div>
                {appraisal?.calibrated_overall_score !== null && appraisal?.calibrated_overall_score !== undefined ? (
                    <div className="mt-1 text-xs text-muted-foreground">Calibrated</div>
                ) : null}
            </td>
            <td className="px-4 py-4 text-muted-foreground">{effectiveRating(appraisal)}</td>
            <td className="px-4 py-4 text-right">
                <Button asChild variant="outline" size="sm">
                    <Link href={route('performance.employees.show', profile.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </Link>
                </Button>
            </td>
        </tr>
    );
}

function MetricCard({
    label,
    value,
    helper,
    icon,
}: {
    label: string;
    value: number;
    helper: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-muted/20 p-6 transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                <div className="text-muted-foreground">{icon}</div>
            </div>

            <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">{value}</p>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {helper}
            </p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
        </div>
    );
}

function UsageRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-lg font-semibold text-foreground">{value}</span>
        </div>
    );
}

function ProgressMetric({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span>{label}</span>
                <span className="text-foreground">{value}%</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground/80" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}
