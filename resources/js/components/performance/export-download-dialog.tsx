import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { downloadFileFromUrl } from '@/lib/download-file';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type ExportDownloadFormat = 'pdf' | 'excel';

type ExportDownloadRequest = {
    url: string;
    format: ExportDownloadFormat;
    subject: string;
    fallbackFilename: string;
};

type ExportDownloadState = 'downloading' | 'success' | 'error';

type Props = {
    request: ExportDownloadRequest | null;
    onClose: () => void;
};

export default function ExportDownloadDialog({ request, onClose }: Props) {
    const [state, setState] = useState<ExportDownloadState>('downloading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [downloadedFilename, setDownloadedFilename] = useState<string | null>(null);
    const activeRequestRef = useRef<ExportDownloadRequest | null>(null);

    useEffect(() => {
        if (!request) {
            return;
        }

        activeRequestRef.current = request;
        setState('downloading');
        setErrorMessage(null);
        setDownloadedFilename(null);

        downloadFileFromUrl(request.url, request.fallbackFilename)
            .then((filename) => {
                if (activeRequestRef.current !== request) {
                    return;
                }

                setDownloadedFilename(filename);
                setState('success');
            })
            .catch((error: unknown) => {
                if (activeRequestRef.current !== request) {
                    return;
                }

                setState('error');
                setErrorMessage(error instanceof Error ? error.message : 'Download failed. Please try again.');
            });
    }, [request]);

    const formatLabel = request?.format === 'pdf' ? 'PDF' : 'Excel';

    return (
        <AlertDialog
            open={request !== null}
            onOpenChange={(open) => {
                if (!open && state !== 'downloading') {
                    onClose();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {state === 'downloading' ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : null}
                        {state === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
                        {state === 'downloading'
                            ? `Preparing ${formatLabel} download`
                            : state === 'success'
                              ? `${formatLabel} download ready`
                              : `${formatLabel} download failed`}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            {request ? (
                                <p>
                                    {state === 'downloading'
                                        ? `Generating ${formatLabel} for "${request.subject}". Your file will download in this browser shortly.`
                                        : state === 'success'
                                          ? `"${downloadedFilename ?? request.fallbackFilename}" has been downloaded.`
                                          : `We could not download "${request.subject}" as ${formatLabel}.`}
                                </p>
                            ) : null}

                            {state === 'downloading' ? (
                                <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span>Please wait while the export is prepared...</span>
                                </div>
                            ) : null}

                            {state === 'error' && errorMessage ? <p className="text-destructive">{errorMessage}</p> : null}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {state !== 'downloading' ? (
                    <AlertDialogFooter>
                        <Button type="button" onClick={onClose}>
                            Close
                        </Button>
                    </AlertDialogFooter>
                ) : null}
            </AlertDialogContent>
        </AlertDialog>
    );
}
