import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, Template } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    ClipboardList,
    FileSpreadsheet,
    FileText,
    Layers3,
    PencilRuler,
    Plus,
} from 'lucide-react';
import { useState } from 'react';

type TemplateExportFormat = 'pdf' | 'excel';

type PendingTemplateExport = {
    templateId: number;
    templateName: string;
    format: TemplateExportFormat;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Templates', href: route('performance.templates.index') },
];

function parseVersionNumber(version?: string | number | null) {
    if (version === null || version === undefined || version === '') return null;

    const cleaned = String(version).replace(/[^\d.]/g, '');
    const parsed = Number.parseFloat(cleaned);

    return Number.isNaN(parsed) ? null : parsed;
}

function formatAverageVersion(templates: Template[]) {
    const values = templates
        .map((template) => parseVersionNumber(template.version))
        .filter((value): value is number => value !== null);

    if (values.length === 0) return '-';

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return `v${average.toFixed(1)}`;
}

function getTemplateSubtitle(template: Template) {
    const business = template.business_weight_percent ?? 0;
    const values = template.values_weight_percent ?? 0;

    if (business >= 80) return 'Business-weighted executive design';
    if (values >= 50) return 'Balanced values-driven framework';
    if (business >= 60) return 'Operational performance template';
    return 'Reusable appraisal sheet';
}

export default function TemplatesIndex({ templates }: { templates: Paginated<Template> }) {
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [pendingExport, setPendingExport] = useState<PendingTemplateExport | null>(null);

    const totalTemplates = templates.total ?? templates.data.length;
    const from = templates.from ?? 0;
    const to = templates.to ?? templates.data.length;

    const highestBusinessWeight =
        templates.data.reduce((max, template) => Math.max(max, template.business_weight_percent ?? 0), 0) || 0;

    const averageVersion = formatAverageVersion(templates.data);

    const openExportDialog = (template: Template, format: TemplateExportFormat) => {
        setPendingExport({
            templateId: template.id,
            templateName: template.name,
            format,
        });
        setExportDialogOpen(true);
    };

    const handleExportDialogOpenChange = (open: boolean) => {
        setExportDialogOpen(open);

        if (!open) {
            setPendingExport(null);
        }
    };

    const handleExportConfirm = () => {
        if (!pendingExport) {
            return;
        }

        const href =
            pendingExport.format === 'pdf'
                ? route('performance.templates.export.pdf', pendingExport.templateId)
                : route('performance.templates.export.excel', pendingExport.templateId);

        window.open(href, '_blank', 'noopener,noreferrer');
        handleExportDialogOpenChange(false);
    };

    const exportFormatLabel = pendingExport?.format === 'pdf' ? 'PDF' : 'Excel';

    return (
        <PerformancePage
            title="Templates"
            description="Create appraisal templates with weights, scales, and item sets."
            breadcrumbs={breadcrumbs}
            
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Template workspace
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                    Templates
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Create appraisal templates with weights, scales, and item sets.
                                </p>
                            </div>
                        </div>

                        <Button asChild>
                            <Link href={route('performance.templates.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Template
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ClipboardList className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{totalTemplates}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Template records available in the current library.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Average Version</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{averageVersion}</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Approximate version level across visible templates.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <BarChart3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Highest Business Weight</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{highestBusinessWeight}%</div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Highest business weighting among visible templates.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="text-lg">Template Catalog</CardTitle>
                                <CardDescription>
                                    Review template versions, weighting ratios, and available actions.
                                </CardDescription>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Showing {from} to {to} of {totalTemplates}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {templates.data.length === 0 ? (
                            <div className="flex min-h-[280px] items-center justify-center p-6">
                                <div className="space-y-2 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
                                        <PencilRuler className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground">No templates found</h3>
                                    <p className="text-sm text-muted-foreground">
                                        There are no appraisal templates available right now.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-muted/30 text-left">
                                            <tr>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Appraisal Template Name
                                                </th>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Version
                                                </th>
                                                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Business / Values Ratio
                                                </th>
                                                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {templates.data.map((template, index) => {
                                                const business = template.business_weight_percent ?? 0;
                                                const values = template.values_weight_percent ?? 0;

                                                return (
                                                    <tr
                                                        key={template.id}
                                                        className={`border-t transition-colors hover:bg-muted/20 ${
                                                            index % 2 === 1 ? 'bg-muted/[0.03]' : ''
                                                        }`}
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground">
                                                                    {template.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {getTemplateSubtitle(template)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <Badge variant="secondary" className="font-normal">
                                                                {template.version}
                                                            </Badge>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <div className="flex min-w-[220px] items-center gap-3">
                                                                <span className="text-sm font-semibold text-foreground">
                                                                    {business} / {values}
                                                                </span>

                                                                <div className="flex h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                                    <div
                                                                        className="h-full bg-foreground/80"
                                                                        style={{ width: `${business}%` }}
                                                                    />
                                                                    <div
                                                                        className="h-full bg-foreground/20"
                                                                        style={{ width: `${values}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-wrap justify-end gap-2">
                                                                <Button asChild variant="ghost" size="sm">
                                                                    <Link href={route('performance.templates.show', template.id)}>
                                                                        View
                                                                    </Link>
                                                                </Button>

                                                                <Button asChild variant="outline" size="sm">
                                                                    <Link href={route('performance.templates.builder', template.id)}>
                                                                        Builder
                                                                    </Link>
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    variant="accent"
                                                                    size="sm"
                                                                    title="Download PDF"
                                                                    onClick={() => openExportDialog(template, 'pdf')}
                                                                >
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                    PDF
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    title="Download Excel"
                                                                    onClick={() => openExportDialog(template, 'excel')}
                                                                >
                                                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                                                    Excel
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col gap-4 border-t bg-muted/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Showing {from} to {to} of {totalTemplates} templates
                                    </span>

                                    <PaginationLinks paginated={templates} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={exportDialogOpen} onOpenChange={handleExportDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Download template as {exportFormatLabel}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingExport
                                ? `This will download "${pendingExport.templateName}" as a ${exportFormatLabel} file.`
                                : 'This will download the selected template.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExportConfirm}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PerformancePage>
    );
}
