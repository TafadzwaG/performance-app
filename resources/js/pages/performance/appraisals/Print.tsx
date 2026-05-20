import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal } from '@/types/performance';
import { Download, Printer } from 'lucide-react';
import * as React from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
    pdfUrl: string;
    pdfDownloadUrl: string;
}

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Print', href: route('performance.appraisals.print', appraisal.id) },
];

export default function AppraisalPrint({ appraisal, pdfUrl, pdfDownloadUrl }: Props) {
    const frameRef = React.useRef<HTMLIFrameElement | null>(null);

    /**
     * Print the iframe contents directly so the output is the actual PDF
     * layout, not the surrounding app chrome.
     */
    const handlePrint = () => {
        const frame = frameRef.current;
        if (!frame) return;
        try {
            frame.contentWindow?.focus();
            frame.contentWindow?.print();
        } catch {
            // Fallback: open the PDF in a new tab so the user can print it from
            // the browser's native PDF viewer.
            window.open(pdfUrl, '_blank');
        }
    };

    return (
        <PerformancePage
            title="Print preview"
            description="Live preview of the PDF layout you'll print or download."
            breadcrumbs={breadcrumbs(appraisal)}
            secondaryActions={
                <>
                    <Button type="button" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button asChild variant="outline">
                        <a href={pdfDownloadUrl}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </a>
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Card className="border shadow-sm">
                    <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                § Print preview
                            </div>
                            <div className="font-display text-foreground text-lg leading-tight font-light tracking-tight">
                                {appraisal.employee_name_snapshot}
                            </div>
                            <div className="text-muted-foreground text-[12px]">
                                {appraisal.cycle_name_snapshot} · {appraisal.template_name_snapshot}
                            </div>
                        </div>
                        <Badge variant="secondary" className="font-mono-brand text-[10px] tracking-[0.18em]">
                            Appraisal #{appraisal.id}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border shadow-sm">
                    <iframe
                        ref={frameRef}
                        title={`Appraisal ${appraisal.id} PDF preview`}
                        src={pdfUrl}
                        className="block h-[min(1100px,calc(100vh-220px))] w-full border-0 bg-muted/20"
                    />
                </Card>
            </div>
        </PerformancePage>
    );
}
