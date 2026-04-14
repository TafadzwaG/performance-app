import PerformancePage from '@/components/performance/PerformancePage';
import RatingScaleLegend from '@/components/performance/RatingScaleLegend';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { Template } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Briefcase,
    ChevronRight,
    ClipboardList,
    Edit,
    FileText,
    Layers3,
    Lightbulb,
    Settings2,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
} from 'lucide-react';

const breadcrumbs = (template: Template): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Templates', href: route('performance.templates.index') },
    { title: template.name, href: route('performance.templates.show', template.id) },
];

function getItemIcon(itemType?: string | null) {
    const normalized = String(itemType ?? '').toLowerCase();

    if (
        normalized.includes('competency') ||
        normalized.includes('behavior') ||
        normalized.includes('value')
    ) {
        return Lightbulb;
    }

    if (
        normalized.includes('kpi') ||
        normalized.includes('business') ||
        normalized.includes('metric')
    ) {
        return TrendingUp;
    }

    if (
        normalized.includes('culture') ||
        normalized.includes('team') ||
        normalized.includes('people')
    ) {
        return Users;
    }

    return ClipboardList;
}

function formatItemType(itemType?: string | null) {
    if (!itemType) return 'Template section';
    return String(itemType).replaceAll('_', ' ');
}

function normalizeItemType(itemType: unknown) {
    if (typeof itemType === 'string') {
        return itemType;
    }

    if (itemType && typeof itemType === 'object' && 'value' in itemType) {
        const value = (itemType as { value?: unknown }).value;
        if (typeof value === 'string') {
            return value;
        }
    }

    return '';
}

export default function TemplateShow({ template }: { template: Template }) {
    const businessWeight = template.business_weight_percent ?? 0;
    const valuesWeight = template.values_weight_percent ?? 0;
    const items = (template.items ?? []).map((item) => ({
        ...item,
        item_type: normalizeItemType(item.item_type),
        title: typeof item.title === 'string' && item.title.trim().length > 0 ? item.title : 'Untitled section',
    }));
    const ratingLevels = template.overall_rating_scale?.levels ?? [];

    return (
        <PerformancePage
            title={template.name}
            description="Template summary, scales, and configured items."
            breadcrumbs={breadcrumbs(template)}
            
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Template overview
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                    {template.name}
                                </h1>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">{template.code}</Badge>
                                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Version {template.version}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button asChild variant="outline">
                                <Link href={route('performance.templates.edit', template.id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Template
                                </Link>
                            </Button>

                            <Button asChild>
                                <Link href={route('performance.templates.builder', template.id)}>
                                    <Settings2 className="mr-2 h-4 w-4" />
                                    Open Builder
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <section className="grid gap-6 lg:grid-cols-3">
                    <Card className="shadow-sm lg:col-span-2">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4.5 w-4.5" />
                                <CardTitle className="text-base">Template Intent</CardTitle>
                            </div>
                            <CardDescription>
                                Summary of the template design, weighting focus, and general appraisal intent.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <p className="text-base leading-7 text-foreground">
                                {template.description?.trim() || 'No description provided.'}
                            </p>

                            <div className="rounded-xl border bg-muted/20 p-5">
                                <div className="mb-4 flex items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Focus Distribution
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Weighting between business outcomes and values assessment.
                                        </p>
                                    </div>

                                    <div className="text-right text-lg font-bold tracking-tight text-foreground">
                                        {businessWeight} / {valuesWeight}
                                    </div>
                                </div>

                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-foreground"
                                        style={{ width: `${businessWeight}%` }}
                                    />
                                    <div
                                        className="h-full bg-foreground/20"
                                        style={{ width: `${valuesWeight}%` }}
                                    />
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-foreground" />
                                        <span className="uppercase tracking-wide">Business Metrics</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-foreground/30" />
                                        <span className="uppercase tracking-wide">Cultural Values</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-base">Template Metadata</CardTitle>
                            </div>
                            <CardDescription>
                                Key identifiers and configuration values for this appraisal template.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Code</span>
                                <span className="font-medium text-foreground">{template.code}</span>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Version</span>
                                <span className="font-medium text-foreground">{template.version}</span>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Business Weight</span>
                                <span className="font-medium text-foreground">{businessWeight}%</span>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Values Weight</span>
                                <span className="font-medium text-foreground">{valuesWeight}%</span>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Configured Items</span>
                                <span className="font-medium text-foreground">{items.length}</span>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Rating Levels</span>
                                <span className="font-medium text-foreground">{ratingLevels.length}</span>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold tracking-tight">Performance Rating Scale</h2>
                    </div>

                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <RatingScaleLegend levels={ratingLevels} />
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold tracking-tight">Configured Template Sections</h2>
                    </div>

                    <Card className="shadow-sm">
                        <CardContent className="space-y-3 p-6">
                            {items.length === 0 ? (
                                <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6">
                                    <div className="space-y-2 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                                            <ClipboardList className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            No configured sections
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            This template does not yet contain any configured items.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const Icon = getItemIcon(item.item_type);

                                    return (
                                        <Link
                                            key={item.id ?? `${item.item_type}-${item.sort_order}`}
                                            href={route('performance.templates.builder', template.id)}
                                            className="group flex items-center justify-between rounded-xl border bg-background p-4 transition-colors hover:bg-muted/20"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground transition-colors group-hover:bg-muted/40">
                                                    <Icon className="h-5 w-5" />
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        {item.title}
                                                    </h3>

                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="uppercase tracking-wide">
                                                            {formatItemType(item.item_type)}
                                                        </span>
                                                        <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                                                        <span>Order: {item.sort_order}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </Link>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </section>

                <Card className="overflow-hidden border-none bg-foreground text-background shadow-sm">
                    <CardContent className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                <h3 className="text-xl font-semibold tracking-tight">
                                    Ready to continue?
                                </h3>
                            </div>

                            <p className="max-w-2xl text-sm text-background/70">
                                Review the template configuration and continue to editing or builder mode for further
                                setup.
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-wrap gap-3">
                            <Button asChild variant="secondary">
                                <Link href={route('performance.templates.edit', template.id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Template
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background"
                            >
                                <Link href={route('performance.templates.builder', template.id)}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Open Builder
                                </Link>
                            </Button>
                        </div>

                        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-background/10 blur-3xl" />
                        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-background/5 blur-2xl" />
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
