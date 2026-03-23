import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { JobTitle } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Briefcase,
    Eye,
    FileText,
    PencilLine,
    ShieldCheck,
    Sparkles,
    Users,
    Wrench,
} from 'lucide-react';

const breadcrumbs = (jobTitle: JobTitle): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Job Titles', href: route('performance.setup.job_titles.index') },
    { title: jobTitle.name, href: route('performance.setup.job_titles.show', jobTitle.id) },
];

function getCodeSegments(code?: string | null) {
    if (!code) return 0;
    return code.split('-').filter(Boolean).length;
}

function getUsageHealth(jobTitle: JobTitle) {
    const employees = jobTitle.employee_profiles_count ?? 0;
    const templates = jobTitle.appraisal_templates_count ?? 0;
    const goals = jobTitle.goal_library_items_count ?? 0;

    const total = employees + templates + goals;
    if (total >= 20) return 'High';
    if (total >= 8) return 'Moderate';
    return 'Emerging';
}

export default function JobTitleShow({ jobTitle }: { jobTitle: JobTitle }) {
    const employees = jobTitle.employee_profiles_count ?? 0;
    const templates = jobTitle.appraisal_templates_count ?? 0;
    const goals = jobTitle.goal_library_items_count ?? 0;
    const usageHealth = getUsageHealth(jobTitle);

    return (
        <PerformancePage
            title={jobTitle.name}
            description="Job title detail and usage summary."
            breadcrumbs={breadcrumbs(jobTitle)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.setup.job_titles.edit', jobTitle.id)}>
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
                            {jobTitle.name}
                        </h1>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {jobTitle.code} • Job Title Registry
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('performance.setup.job_titles.edit', jobTitle.id)}>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Edit Role
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
                                            {jobTitle.code}
                                        </Badge>

                                        <Badge variant={jobTitle.is_active ? 'secondary' : 'outline'}>
                                            {jobTitle.is_active ? 'Active' : 'Inactive'}
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
                                    Role Description
                                </CardTitle>
                                <CardDescription>
                                    Context for how this job title is used in the appraisal system.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <p className="text-sm leading-7 text-muted-foreground">
                                    {jobTitle.description ?? 'No description provided.'}
                                </p>

                                <div className="border-t pt-6">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Classification Notes
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">Role Architecture</Badge>
                                        <Badge variant="outline">Performance Setup</Badge>
                                        <Badge variant="outline">Catalogued Title</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12">
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.16em] text-muted-foreground">
                                        <span>Registry Summary</span>
                                        <Briefcase className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <InfoRow label="Job Title Name" value={jobTitle.name} />
                                    <InfoRow label="Role Code" value={jobTitle.code} />
                                    <InfoRow
                                        label="Lifecycle"
                                        value={jobTitle.is_active ? 'Available for assignment' : 'Inactive in registry'}
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
                                        <span>Role Health</span>
                                        <Sparkles className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    <ProgressMetric
                                        label="Catalog Completeness"
                                        value={jobTitle.description ? 92 : 58}
                                    />
                                    <ProgressMetric
                                        label="Usage Coverage"
                                        value={Math.min((employees + templates + goals) * 8, 100)}
                                    />

                                    <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/10 p-3 text-xs text-muted-foreground">
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Role health insight generated from current usage data
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