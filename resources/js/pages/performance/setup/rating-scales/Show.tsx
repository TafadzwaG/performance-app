import PerformancePage from '@/components/performance/PerformancePage';
import RatingScaleLegend from '@/components/performance/RatingScaleLegend';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { RatingScale } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    FileText,
    Layers3,
    Palette,
    PencilLine,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react';

const breadcrumbs = (scale: RatingScale): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Rating Scales', href: route('performance.setup.rating_scales.index') },
    { title: scale.name, href: route('performance.setup.rating_scales.show', scale.id) },
];

function normalizeScaleType(value?: string | null) {
    if (!value) return 'Unknown';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCoverageMode(scale: RatingScale) {
    const withRanges = (scale.levels ?? []).filter((level) => level.min_percent !== null || level.max_percent !== null).length;
    if (withRanges === (scale.levels?.length ?? 0) && withRanges > 0) return 'Band mapped';
    if (withRanges > 0) return 'Mixed';
    return 'Value only';
}

export default function RatingScaleShow({ ratingScale }: { ratingScale: RatingScale }) {
    const levels = ratingScale.levels ?? [];
    const defaultLevels = levels.filter((level) => level.is_default).length;
    const coverageMode = getCoverageMode(ratingScale);

    return (
        <PerformancePage
            title={ratingScale.name}
            description="Rating scale detail and configured levels."
            breadcrumbs={breadcrumbs(ratingScale)}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('performance.setup.rating_scales.edit', ratingScale.id)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{ratingScale.name}</h1>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {ratingScale.code} | Rating Scale Registry
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('performance.setup.rating_scales.edit', ratingScale.id)}>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Edit Scale
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
                                            {ratingScale.code}
                                        </Badge>
                                        <Badge variant="outline">{normalizeScaleType(ratingScale.applies_to)}</Badge>
                                        <Badge variant={ratingScale.is_active ? 'secondary' : 'outline'}>
                                            {ratingScale.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Activity className="h-4 w-4" />
                                        Coverage: {coverageMode}
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3">
                                    <MetricCard
                                        label="Levels"
                                        value={levels.length}
                                        helper="Configured entries"
                                        icon={<Layers3 className="h-4 w-4" />}
                                    />
                                    <MetricCard
                                        label="Defaults"
                                        value={defaultLevels}
                                        helper="Initial selections"
                                        icon={<ShieldCheck className="h-4 w-4" />}
                                    />
                                    <MetricCard
                                        label="Range Bands"
                                        value={levels.filter((level) => level.min_percent !== null || level.max_percent !== null).length}
                                        helper="Mapped thresholds"
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
                                    Scale Description
                                </CardTitle>
                                <CardDescription>
                                    Context for how this scale should be used during scoring.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <p className="text-sm leading-7 text-muted-foreground">
                                    {ratingScale.description ?? 'No description provided.'}
                                </p>

                                <div className="border-t pt-6">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Scale Notes
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{normalizeScaleType(ratingScale.applies_to)}</Badge>
                                        <Badge variant="outline">{coverageMode}</Badge>
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
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <InfoRow label="Scale Name" value={ratingScale.name} />
                                    <InfoRow label="Applies To" value={normalizeScaleType(ratingScale.applies_to)} />
                                    <InfoRow label="Coverage Mode" value={coverageMode} />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.16em] text-muted-foreground">
                                        <span>Level Legend</span>
                                        <Palette className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <RatingScaleLegend levels={levels} />
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.16em] text-muted-foreground">
                                        <span>Scale Health</span>
                                        <Sparkles className="h-4 w-4" />
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    <ProgressMetric label="Catalog Completeness" value={ratingScale.description ? 92 : 58} />
                                    <ProgressMetric
                                        label="Range Mapping"
                                        value={levels.length > 0 ? Math.round((levels.filter((level) => level.min_percent !== null || level.max_percent !== null).length / levels.length) * 100) : 0}
                                    />

                                    <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/10 p-3 text-xs text-muted-foreground">
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Scale health insight generated from the configured legend
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
