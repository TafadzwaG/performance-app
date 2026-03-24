import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Competency } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    Activity,
    Building2,
    FileText,
    Gauge,
    Network,
    PencilLine,
    ShieldCheck,
    Sparkles,
    UserRoundCog,
} from 'lucide-react';

const breadcrumbs = (competency: Competency): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Competencies', href: route('performance.setup.competencies.index') },
    { title: competency.name, href: route('performance.setup.competencies.show', competency.id) },
];

function normalizeCategory(category?: string | null) {
    if (!category) return 'Unclassified';
    return category.charAt(0).toUpperCase() + category.slice(1);
}

function scopeSummary(competency: Competency) {
    if (competency.department && competency.job_title) return 'Department + Job Title scoped';
    if (competency.department) return 'Department scoped';
    if (competency.job_title) return 'Job Title scoped';
    return 'Global catalogue entry';
}

export default function CompetencyShow({ competency }: { competency: Competency }) {
    const ratingsCount = competency.appraisal_competency_ratings_count ?? 0;

    return (
        <PerformancePage
            title={competency.name}
            description="Competency detail and usage summary."
            breadcrumbs={breadcrumbs(competency)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.setup.competencies.edit', competency.id)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{competency.name}</h1>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {competency.code} | Competency Registry
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('performance.setup.competencies.edit', competency.id)}>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Edit Competency
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
                                            {competency.code}
                                        </Badge>
                                        <Badge variant="outline">{normalizeCategory(competency.category)}</Badge>
                                        <Badge variant={competency.is_active ? 'secondary' : 'outline'}>
                                            {competency.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Activity className="h-4 w-4" />
                                        {scopeSummary(competency)}
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3">
                                    <MetricCard
                                        label="Ratings"
                                        value={ratingsCount}
                                        helper="Appraisal references"
                                        icon={<Gauge className="h-4 w-4" />}
                                    />

                                    <MetricCard
                                        label="Department Scope"
                                        value={competency.department ? 1 : 0}
                                        helper={competency.department?.name ?? 'Global'}
                                        icon={<Building2 className="h-4 w-4" />}
                                    />

                                    <MetricCard
                                        label="Role Scope"
                                        value={competency.job_title ? 1 : 0}
                                        helper={competency.job_title?.name ?? 'All roles'}
                                        icon={<UserRoundCog className="h-4 w-4" />}
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
                                    Behaviour Definition
                                </CardTitle>
                                <CardDescription>
                                    The descriptive expectation used by managers and reviewers.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <p className="text-sm leading-7 text-muted-foreground">
                                    {competency.description ?? 'No description provided.'}
                                </p>

                                <div className="border-t pt-6">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Scope Labels
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{normalizeCategory(competency.category)}</Badge>
                                        <Badge variant="outline">{scopeSummary(competency)}</Badge>
                                        <Badge variant="outline">Performance Setup</Badge>
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
                                        <Network className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <InfoRow label="Competency Name" value={competency.name} />
                                    <InfoRow label="Category" value={normalizeCategory(competency.category)} />
                                    <InfoRow label="Scope" value={scopeSummary(competency)} />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.16em] text-muted-foreground">
                                        <span>Applicability</span>
                                        <Building2 className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <UsageRow label="Department" value={competency.department?.name ?? 'All departments'} />
                                    <UsageRow label="Job Title" value={competency.job_title?.name ?? 'All job titles'} />
                                    <UsageRow label="Lifecycle" value={competency.is_active ? 'Available for scoring' : 'Inactive in registry'} />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.16em] text-muted-foreground">
                                        <span>Usage Health</span>
                                        <Sparkles className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    <ProgressMetric label="Catalog Completeness" value={competency.description ? 92 : 58} />
                                    <ProgressMetric label="Review Reuse" value={Math.min(ratingsCount * 10, 100)} />

                                    <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/10 p-3 text-xs text-muted-foreground">
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Usage health insight based on current appraisal rating references
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
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{helper}</p>
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

function UsageRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold text-foreground">{value}</span>
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
