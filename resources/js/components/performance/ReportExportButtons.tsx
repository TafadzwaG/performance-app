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
import { Button } from '@/components/ui/button';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';

type ExportFormat = 'xlsx' | 'pdf';

interface ReportExportButtonsProps {
    exportKey: string;
    reportTitle: string;
    reviewCycleId?: number | null;
    className?: string;
    size?: 'default' | 'sm';
}

export default function ReportExportButtons({
    exportKey,
    reportTitle,
    reviewCycleId,
    className,
    size = 'default',
}: ReportExportButtonsProps) {
    const { auth } = usePage<SharedData>().props;
    const canExport = auth.permissions.includes('performance.reports.export');
    const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);

    const exportHref = useMemo(() => {
        if (!pendingFormat) {
            return null;
        }

        return route('performance.reports.export', {
            report: exportKey,
            format: pendingFormat,
            review_cycle_id: reviewCycleId ?? undefined,
        });
    }, [exportKey, pendingFormat, reviewCycleId]);

    const handleConfirm = () => {
        if (!exportHref) {
            return;
        }

        window.location.assign(exportHref);
        setPendingFormat(null);
    };

    if (!canExport) {
        return null;
    }

    const buttonClassName = size === 'sm' ? 'h-8 px-3 text-xs' : undefined;

    return (
        <>
            <div className={className ?? 'flex flex-wrap items-center gap-2'}>
                <Button type="button" variant="outline" size={size} className={buttonClassName} onClick={() => setPendingFormat('xlsx')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Download Excel
                </Button>
                <Button type="button" variant="outline" size={size} className={buttonClassName} onClick={() => setPendingFormat('pdf')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>

            <AlertDialog open={pendingFormat !== null} onOpenChange={(open) => !open && setPendingFormat(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Download {pendingFormat === 'pdf' ? 'PDF' : 'Excel'} report?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will download <strong>{reportTitle}</strong> using the current review cycle filter
                            {reviewCycleId ? '' : ' (all cycles)'} in the branded Studio {pendingFormat === 'pdf' ? 'PDF' : 'Excel'} format.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>Continue download</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
