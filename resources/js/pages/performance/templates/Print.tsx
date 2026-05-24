import ExportDownloadDialog, { type ExportDownloadFormat } from '@/components/performance/export-download-dialog';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Template } from '@/types/performance';
import { Link } from '@inertiajs/react';
import { Code2, Download, Eye, FileCode2, Printer, RefreshCw } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

type PreviewMode = 'pdf' | 'layout';

interface Props {
    template: Pick<
        Template,
        'id' | 'name' | 'code' | 'version' | 'description' | 'business_weight_percent' | 'values_weight_percent'
    >;
    pdfUrl: string;
    layoutUrl: string;
    pdfDownloadUrl: string;
    layoutBladePath: string;
}

const breadcrumbs = (template: Props['template']): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Templates', href: route('performance.templates.index') },
    { title: template.name, href: route('performance.templates.show', template.id) },
    { title: 'Preview', href: route('performance.templates.print', template.id) },
];

export default function TemplatePrint({ template, pdfUrl, layoutUrl, pdfDownloadUrl, layoutBladePath }: Props) {
    const [previewMode, setPreviewMode] = useState<PreviewMode>('layout');
    const [frameKey, setFrameKey] = useState(0);
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const [exportRequest, setExportRequest] = useState<{
        url: string;
        format: ExportDownloadFormat;
        subject: string;
        fallbackFilename: string;
    } | null>(null);

    const previewUrl = useMemo(() => {
        const base = previewMode === 'pdf' ? pdfUrl : layoutUrl;
        const separator = base.includes('?') ? '&' : '?';

        return `${base}${separator}t=${frameKey}`;
    }, [previewMode, pdfUrl, layoutUrl, frameKey]);
    const previewTitle =
        previewMode === 'pdf' ? `Template ${template.id} PDF preview` : `Template ${template.id} Blade layout preview`;

    const ratioLabel = useMemo(
        () => `${template.business_weight_percent ?? 0} / ${template.values_weight_percent ?? 0}`,
        [template.business_weight_percent, template.values_weight_percent],
    );

    const handlePrint = () => {
        const frame = frameRef.current;
        if (!frame) {
            return;
        }

        try {
            frame.contentWindow?.focus();
            frame.contentWindow?.print();
        } catch {
            window.open(previewUrl, '_blank');
        }
    };

    const startPdfDownload = () => {
        setExportRequest({
            url: pdfDownloadUrl,
            format: 'pdf',
            subject: template.name,
            fallbackFilename: `appraisal-template-${template.code ?? template.id}.pdf`,
        });
    };

    return (
        <PerformancePage
            title="Template preview"
            description="Preview the Blade layout and final PDF output before adjusting positioning, logos, and export styling."
            breadcrumbs={breadcrumbs(template)}
            secondaryActions={
                <>
                    <Button type="button" variant="outline" onClick={() => setFrameKey((current) => current + 1)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Preview
                    </Button>
                    <Button type="button" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button type="button" variant="accent" onClick={startPdfDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Card className="border shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                § Template export preview
                            </div>
                            <div className="font-display text-foreground text-lg leading-tight font-light tracking-tight">
                                {template.name}
                            </div>
                            <div className="text-muted-foreground text-[12px]">
                                {template.code} · v{template.version} · Business / Values {ratioLabel}
                            </div>
                            {template.description ? (
                                <p className="text-muted-foreground max-w-3xl text-sm">{template.description}</p>
                            ) : null}
                        </div>

                        <Badge variant="secondary" className="font-mono-brand w-fit text-[10px] tracking-[0.18em]">
                            Template #{template.id}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant={previewMode === 'layout' ? 'default' : 'outline'}
                                onClick={() => setPreviewMode('layout')}
                            >
                                <FileCode2 className="mr-2 h-4 w-4" />
                                Blade Layout
                            </Button>
                            <Button
                                type="button"
                                variant={previewMode === 'pdf' ? 'default' : 'outline'}
                                onClick={() => setPreviewMode('pdf')}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                PDF Output
                            </Button>
                        </div>

                        <div className="text-muted-foreground flex items-start gap-2 text-sm">
                            <Code2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                Edit positioning in{' '}
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{layoutBladePath}</code>
                                , then use <strong className="font-medium text-foreground">Refresh Preview</strong>.
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border shadow-sm">
                    <iframe
                        key={`${previewMode}-${frameKey}`}
                        ref={frameRef}
                        title={previewTitle}
                        src={previewUrl}
                        className="block h-[min(1100px,calc(100vh-260px))] w-full border-0 bg-muted/20"
                    />
                </Card>

                <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                        <Link href={route('performance.templates.show', template.id)}>Back to template</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('performance.templates.builder', template.id)}>Open builder</Link>
                    </Button>
                </div>
            </div>

            <ExportDownloadDialog request={exportRequest} onClose={() => setExportRequest(null)} />
        </PerformancePage>
    );
}
