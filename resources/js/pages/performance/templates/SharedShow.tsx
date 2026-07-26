import PerformancePage from '@/components/performance/PerformancePage';
import RatingScaleLegend from '@/components/performance/RatingScaleLegend';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Template } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, ClipboardList, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SourceOrganization {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    template: Template;
    sourceOrganization: SourceOrganization;
    can: {
        import: boolean;
    };
}

export default function SharedTemplateShow({ template, sourceOrganization, can }: Props) {
    const [importing, setImporting] = useState(false);
    const businessWeight = template.business_weight_percent ?? 0;
    const valuesWeight = template.values_weight_percent ?? 0;
    const items = template.items ?? [];
    const ratingLevels = template.overall_rating_scale?.levels ?? [];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Templates', href: route('performance.templates.index') },
        {
            title: template.name,
            href: route('performance.templates.shared.show', {
                organization: sourceOrganization.id,
                template: template.id,
            }),
        },
    ];

    const importTemplate = () => {
        setImporting(true);
        router.post(
            route('performance.templates.shared.import', {
                organization: sourceOrganization.id,
                template: template.id,
            }),
            {},
            { onFinish: () => setImporting(false) },
        );
    };

    return (
        <PerformancePage
            title={template.name}
            description={`Read-only view of a template from ${sourceOrganization.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {sourceOrganization.name}
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
                                <Link
                                    href={route('performance.templates.index', {
                                        source_organization_id: sourceOrganization.id,
                                    })}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to shared templates
                                </Link>
                            </Button>

                            {can.import ? (
                                <Button type="button" onClick={importTemplate} disabled={importing}>
                                    {importing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Use in this organisation
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </div>

                <section className="grid gap-6 lg:grid-cols-3">
                    <Card className="shadow-sm lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Template summary</CardTitle>
                            <CardDescription>
                                Imported templates are copied into your organisation. Missing setup records are created
                                automatically when needed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-base leading-7 text-foreground">
                                {template.description?.trim() || 'No description provided.'}
                            </p>

                            <div className="rounded-xl border bg-muted/20 p-5">
                                <div className="mb-4 flex items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">Focus distribution</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Business outcomes vs values assessment.
                                        </p>
                                    </div>
                                    <div className="text-right text-lg font-bold tracking-tight text-foreground">
                                        {businessWeight} / {valuesWeight}
                                    </div>
                                </div>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div className="h-full bg-foreground" style={{ width: `${businessWeight}%` }} />
                                    <div className="h-full bg-foreground/20" style={{ width: `${valuesWeight}%` }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Objectives</span>
                                <span className="font-medium text-foreground">
                                    {template.min_objectives} - {template.max_objectives}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Configured items</span>
                                <span className="font-medium text-foreground">{items.length}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium text-foreground">
                                    {template.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-semibold tracking-tight">Rating scale</h2>
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
                        <h2 className="text-lg font-semibold tracking-tight">Template sections</h2>
                    </div>
                    <Card className="shadow-sm">
                        <CardContent className="space-y-3 p-6">
                            {items.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No items configured.</p>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id ?? `${item.title}-${item.sort_order}`} className="rounded-xl border p-4">
                                        <div className="font-medium text-foreground">{item.title}</div>
                                        {item.description ? (
                                            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </PerformancePage>
    );
}
