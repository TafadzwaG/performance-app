import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_PALETTE, type Palette, usePalette } from '@/hooks/use-palette';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CircleOff, Droplets, ImagePlus, Palette as PaletteIcon, RotateCcw, SwatchBook, UploadCloud } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Palette Settings',
        href: '/palette-settings',
    },
];

const fields: Array<{ key: keyof Palette; label: string }> = [
    { key: 'moss', label: 'Moss Velvet' },
    { key: 'cloud', label: 'Cloud Milk' },
    { key: 'mist', label: 'Match Mist' },
    { key: 'coal', label: 'Dusty Coal' },
];

function normalizeHex(value: string) {
    const raw = value.trim().toUpperCase();
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#[0-9A-F]{6}$/.test(withHash) ? withHash : null;
}

export default function PaletteSettingsPage() {
    const { palette, updateColor, resetPalette, previewColors } = usePalette();
    const logoUrl = (usePage().props as { branding?: { logoUrl?: string | null } }).branding?.logoUrl ?? null;
    const [drafts, setDrafts] = useState<Palette>(palette);
    const [logoError, setLogoError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setDrafts(palette);
    }, [palette]);

    const applyHex = (key: keyof Palette) => {
        const normalized = normalizeHex(drafts[key]);
        if (!normalized) {
            setDrafts((current) => ({ ...current, [key]: palette[key] }));
            return;
        }
        updateColor(key, normalized);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
            'image/svg+xml': ['.svg'],
        },
        multiple: false,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (!file) return;

            setIsUploading(true);
            setLogoError(null);

            router.post(
                route('palette.logo.update'),
                { logo: file },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onError: (errors) => setLogoError(typeof errors.logo === 'string' ? errors.logo : 'Logo upload failed.'),
                    onFinish: () => setIsUploading(false),
                },
            );
        },
    });

    const handleResetLogo = () => {
        setLogoError(null);
        router.delete(route('palette.logo.destroy'), {
            preserveScroll: true,
            onError: () => setLogoError('Failed to reset logo.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Palette Settings" />

            <div className="space-y-6 px-4 py-6">
                <HeadingSmall
                    title="Palette Settings"
                    description="Manage application colors and branding assets independently from profile/account settings."
                />

                <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PaletteIcon className="h-5 w-5 text-primary" />
                                Live Palette
                            </CardTitle>
                            <CardDescription>Use color picker or HEX values (example: #385144).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {fields.map((field) => (
                                <div key={field.key} className="grid gap-2 md:grid-cols-[220px_1fr_140px] md:items-center">
                                    <Label htmlFor={`palette-${field.key}`} className="font-medium">
                                        {field.label}
                                    </Label>
                                    <Input
                                        id={`palette-${field.key}`}
                                        type="color"
                                        value={palette[field.key]}
                                        onChange={(event) => {
                                            const value = event.target.value.toUpperCase();
                                            setDrafts((current) => ({ ...current, [field.key]: value }));
                                            updateColor(field.key, value);
                                        }}
                                        className="h-10 cursor-pointer p-1"
                                    />
                                    <Input
                                        value={drafts[field.key]}
                                        onChange={(event) => setDrafts((current) => ({ ...current, [field.key]: event.target.value.toUpperCase() }))}
                                        onBlur={() => applyHex(field.key)}
                                        placeholder={DEFAULT_PALETTE[field.key]}
                                        maxLength={7}
                                    />
                                </div>
                            ))}

                            <div className="flex flex-wrap items-center gap-2">
                                {previewColors.map((color) => (
                                    <Badge key={color} variant="outline" className="gap-2 px-2.5 py-1">
                                        <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: color }} />
                                        {color}
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        resetPalette();
                                        setDrafts(DEFAULT_PALETTE);
                                    }}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset Defaults
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <SwatchBook className="h-5 w-5 text-primary" />
                                Branding Logo
                            </CardTitle>
                            <CardDescription>Upload a new system logo with drag-and-drop dropzone.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                {...getRootProps()}
                                className={`rounded-lg border border-dashed p-6 text-center transition-colors ${
                                    isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                                }`}
                            >
                                <input {...getInputProps()} />
                                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border bg-background">
                                    <UploadCloud className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-foreground">
                                    {isDragActive ? 'Drop the logo here...' : 'Drag & drop logo here, or click to upload'}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP or SVG. Max 3MB.</p>
                                {isUploading ? <p className="mt-2 text-xs text-primary">Uploading...</p> : null}
                            </div>

                            {logoError ? <p className="text-sm text-destructive">{logoError}</p> : null}

                            <div className="rounded-lg border bg-muted/10 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                                    <ImagePlus className="h-4 w-4 text-primary" />
                                    Current Logo Preview
                                </div>
                                {logoUrl ? (
                                    <div className="flex h-20 items-center justify-center rounded-md border bg-background">
                                        <img src={logoUrl} alt="Current system logo" className="max-h-14 max-w-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="flex h-20 items-center justify-center rounded-md border bg-background text-sm text-muted-foreground">
                                        No uploaded logo. Default logo is active.
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                                    <Droplets className="mr-2 h-4 w-4" />
                                    Refresh Preview
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!logoUrl}
                                    onClick={handleResetLogo}
                                >
                                    <CircleOff className="mr-2 h-4 w-4" />
                                    Reset Logo
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
