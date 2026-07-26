import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { router, usePage } from '@inertiajs/react';
import { CircleOff, ImagePlus, ShieldCheck, UploadCloud } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

const MAX_LOGO_BYTES = 3 * 1024 * 1024;

type Props = {
    updateRoute?: string;
    destroyRoute?: string;
    title?: string;
    description?: string;
};

function rejectionMessage(rejections: FileRejection[]): string {
    const error = rejections[0]?.errors[0];

    if (!error) {
        return 'Logo upload failed.';
    }

    if (error.code === 'file-too-large') {
        return 'Logo must be 3MB or smaller.';
    }

    if (error.code === 'file-invalid-type') {
        return 'Use PNG, JPG, or WEBP images only.';
    }

    return error.message;
}

export default function BrandingLogoDropzone({
    updateRoute = route('settings.logo.update'),
    destroyRoute = route('settings.logo.destroy'),
    title = 'Company Logo',
    description = 'Upload your company logo with drag-and-drop. It appears in the app shell and branded exports.',
}: Props) {
    const logoUrl = (usePage().props as { branding?: { logoUrl?: string | null } }).branding?.logoUrl ?? null;
    const [logoError, setLogoError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const uploadLogo = useCallback(
        (file: File) => {
            setIsUploading(true);
            setLogoError(null);

            router.post(
                updateRoute,
                { logo: file },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onError: (errors) => setLogoError(typeof errors.logo === 'string' ? errors.logo : 'Logo upload failed.'),
                    onFinish: () => setIsUploading(false),
                },
            );
        },
        [updateRoute],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
        },
        maxSize: MAX_LOGO_BYTES,
        multiple: false,
        disabled: isUploading,
        noClick: isUploading,
        noKeyboard: isUploading,
        onDrop: (acceptedFiles, rejections) => {
            if (rejections.length > 0) {
                setLogoError(rejectionMessage(rejections));
                return;
            }

            const file = acceptedFiles[0];
            if (!file) {
                return;
            }

            uploadLogo(file);
        },
    });

    const resetLogo = () => {
        setLogoError(null);

        router.delete(destroyRoute, {
            preserveScroll: true,
            onError: () => setLogoError('Failed to reset logo.'),
        });
    };

    return (
        <Card className="border shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    {...getRootProps()}
                    className={`cursor-pointer rounded-lg border border-dashed p-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                    } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border bg-background">
                        <UploadCloud className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        {isUploading
                            ? 'Uploading logo...'
                            : isDragActive
                              ? 'Drop the logo here...'
                              : 'Drag and drop your logo here, or click to browse'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WEBP. Max 3MB.</p>
                </div>

                {logoError ? <p className="text-sm text-destructive">{logoError}</p> : null}

                <div className="rounded-lg border bg-muted/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Current Logo
                    </div>
                    {logoUrl ? (
                        <div className="flex h-20 items-center justify-center rounded-md border bg-background">
                            <img src={logoUrl} alt="Current company logo" className="max-h-14 max-w-full object-contain" />
                        </div>
                    ) : (
                        <div className="flex h-20 items-center justify-center rounded-md border bg-background text-sm text-muted-foreground">
                            No custom logo uploaded. The default logo is active.
                        </div>
                    )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="outline" onClick={() => router.reload()}>
                        Refresh Preview
                    </Button>
                    <Button type="button" variant="outline" disabled={!logoUrl || isUploading} onClick={resetLogo}>
                        <CircleOff className="mr-2 h-4 w-4" />
                        Reset Logo
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
