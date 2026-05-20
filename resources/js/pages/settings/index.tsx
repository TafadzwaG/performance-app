import HeadingSmall from '@/components/heading-small';
import OperationsPanel, { type OperationsSnapshot } from '@/components/settings/operations-panel';
import SettingsTabs, { type SettingsTab } from '@/components/settings/settings-tabs';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_PALETTE, type Palette, usePalette } from '@/hooks/use-palette';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    CircleOff,
    Droplets,
    ImagePlus,
    Mail,
    Palette as PaletteIcon,
    RotateCcw,
    Save,
    Send,
    Settings2,
    ShieldCheck,
    UploadCloud,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Settings', href: route('settings.index') }];

type SystemSettings = {
    company_name: string | null;
    company_legal_name: string | null;
    company_registration_number: string | null;
    company_tax_number: string | null;
    company_email: string | null;
    company_phone: string | null;
    company_website: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state_province: string | null;
    postal_code: string | null;
    country: string | null;
    report_footer: string | null;
    smtp_host: string | null;
    smtp_port: number | string | null;
    smtp_username: string | null;
    smtp_password: string;
    smtp_password_set: boolean;
    smtp_encryption: string | null;
    mail_from_address: string | null;
    mail_from_name: string | null;
    mail_reply_to_address: string | null;
    mail_reply_to_name: string | null;
    mail_notifications_enabled: boolean;
};

type SettingsForm = {
    [key: string]: string | number | boolean | null;
    company_name: string;
    company_legal_name: string;
    company_registration_number: string;
    company_tax_number: string;
    company_email: string;
    company_phone: string;
    company_website: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
    report_footer: string;
    smtp_host: string;
    smtp_port: string;
    smtp_username: string;
    smtp_password: string;
    smtp_encryption: string;
    mail_from_address: string;
    mail_from_name: string;
    mail_reply_to_address: string;
    mail_reply_to_name: string;
    mail_notifications_enabled: boolean;
};

interface Props {
    settings: SystemSettings;
    operations: OperationsSnapshot;
}

const paletteFields: Array<{ key: keyof Palette; label: string; hint: string }> = [
    { key: 'sand', label: 'Sand / Primary', hint: 'Secondary surfaces, ratings, and chart accents.' },
    { key: 'ink', label: 'Ink / Foreground', hint: 'Primary buttons, headings, and key controls.' },
    { key: 'cream', label: 'Cream / Background', hint: 'Application backgrounds and calm report surfaces.' },
    { key: 'pine', label: 'Pine / Accent', hint: 'Highlights, success states, and branded moments.' },
];

function value(input: string | number | boolean | null | undefined) {
    return input === null || input === undefined ? '' : String(input);
}

function normalizeHex(input: string) {
    const raw = input.trim().toUpperCase();
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;

    return /^#[0-9A-F]{6}$/.test(withHash) ? withHash : null;
}

function resolveTabFromUrl(): SettingsTab {
    return new URLSearchParams(window.location.search).get('tab') === 'operations' ? 'operations' : 'general';
}

export default function SettingsIndex({ settings, operations }: Props) {
    const logoUrl = (usePage().props as { branding?: { logoUrl?: string | null } }).branding?.logoUrl ?? null;
    const [activeTab, setActiveTab] = useState<SettingsTab>(resolveTabFromUrl);
    const { palette, updateColor, resetPalette, previewColors } = usePalette();
    const [drafts, setDrafts] = useState<Palette>(palette);
    const [logoError, setLogoError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testEmailError, setTestEmailError] = useState<string | null>(null);

    const { data, setData, put, processing, errors } = useForm<SettingsForm>({
        company_name: value(settings.company_name),
        company_legal_name: value(settings.company_legal_name),
        company_registration_number: value(settings.company_registration_number),
        company_tax_number: value(settings.company_tax_number),
        company_email: value(settings.company_email),
        company_phone: value(settings.company_phone),
        company_website: value(settings.company_website),
        address_line_1: value(settings.address_line_1),
        address_line_2: value(settings.address_line_2),
        city: value(settings.city),
        state_province: value(settings.state_province),
        postal_code: value(settings.postal_code),
        country: value(settings.country),
        report_footer: value(settings.report_footer),
        smtp_host: value(settings.smtp_host),
        smtp_port: value(settings.smtp_port),
        smtp_username: value(settings.smtp_username),
        smtp_password: '',
        smtp_encryption: value(settings.smtp_encryption || 'tls'),
        mail_from_address: value(settings.mail_from_address),
        mail_from_name: value(settings.mail_from_name),
        mail_reply_to_address: value(settings.mail_reply_to_address),
        mail_reply_to_name: value(settings.mail_reply_to_name),
        mail_notifications_enabled: settings.mail_notifications_enabled,
    });

    useEffect(() => setDrafts(palette), [palette]);

    useEffect(() => {
        setActiveTab(resolveTabFromUrl());
    }, [operations]);

    const changeTab = (tab: SettingsTab) => {
        if (tab === 'operations') {
            router.get(route('settings.index'), { tab: 'operations' }, { preserveScroll: true });
            return;
        }

        router.get(route('settings.index'), {}, { preserveScroll: true });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(route('settings.update'), { preserveScroll: true });
    };

    const sendTestEmail = () => {
        setTestEmailError(null);

        router.post(
            route('settings.test_email'),
            { test_email: testEmail },
            {
                preserveScroll: true,
                onError: (formErrors) => setTestEmailError(typeof formErrors.test_email === 'string' ? formErrors.test_email : 'Test email failed.'),
            },
        );
    };

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
                route('settings.logo.update'),
                { logo: file },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onError: (formErrors) => setLogoError(typeof formErrors.logo === 'string' ? formErrors.logo : 'Logo upload failed.'),
                    onFinish: () => setIsUploading(false),
                },
            );
        },
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />

            <div className="space-y-6 px-4 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <HeadingSmall
                        title="Settings"
                        description={
                            activeTab === 'general'
                                ? 'Manage company identity, report branding, interface colors, and email notification delivery.'
                                : 'Monitor queued jobs, review storage usage, and manage application files.'
                        }
                    />

                    {activeTab === 'general' ? (
                        <Button type="submit" form="system-settings-form" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                        </Button>
                    ) : null}
                </div>

                <SettingsTabs active={activeTab} onChange={changeTab} />

                {activeTab === 'operations' ? <OperationsPanel operations={operations} /> : null}

                {activeTab === 'general' ? (
            <form id="system-settings-form" onSubmit={submit} className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Company Information
                            </CardTitle>
                            <CardDescription>Used on report screens, exports, printed reports, and notification identity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Full Company Name" id="company-name" error={errors.company_name}>
                                    <Input id="company-name" value={data.company_name} onChange={(event) => setData('company_name', event.target.value)} />
                                </Field>
                                <Field label="Legal Name" id="company-legal-name" error={errors.company_legal_name}>
                                    <Input id="company-legal-name" value={data.company_legal_name} onChange={(event) => setData('company_legal_name', event.target.value)} />
                                </Field>
                                <Field label="Registration Number" id="company-registration-number" error={errors.company_registration_number}>
                                    <Input id="company-registration-number" value={data.company_registration_number} onChange={(event) => setData('company_registration_number', event.target.value)} />
                                </Field>
                                <Field label="Tax Number" id="company-tax-number" error={errors.company_tax_number}>
                                    <Input id="company-tax-number" value={data.company_tax_number} onChange={(event) => setData('company_tax_number', event.target.value)} />
                                </Field>
                                <Field label="Company Email" id="company-email" error={errors.company_email}>
                                    <Input id="company-email" type="email" value={data.company_email} onChange={(event) => setData('company_email', event.target.value)} />
                                </Field>
                                <Field label="Phone" id="company-phone" error={errors.company_phone}>
                                    <Input id="company-phone" value={data.company_phone} onChange={(event) => setData('company_phone', event.target.value)} />
                                </Field>
                                <Field label="Website" id="company-website" error={errors.company_website}>
                                    <Input id="company-website" type="url" value={data.company_website} onChange={(event) => setData('company_website', event.target.value)} />
                                </Field>
                                <Field label="Country" id="country" error={errors.country}>
                                    <Input id="country" value={data.country} onChange={(event) => setData('country', event.target.value)} />
                                </Field>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Address Line 1" id="address-line-1" error={errors.address_line_1}>
                                    <Input id="address-line-1" value={data.address_line_1} onChange={(event) => setData('address_line_1', event.target.value)} />
                                </Field>
                                <Field label="Address Line 2" id="address-line-2" error={errors.address_line_2}>
                                    <Input id="address-line-2" value={data.address_line_2} onChange={(event) => setData('address_line_2', event.target.value)} />
                                </Field>
                                <Field label="City" id="city" error={errors.city}>
                                    <Input id="city" value={data.city} onChange={(event) => setData('city', event.target.value)} />
                                </Field>
                                <Field label="State / Province" id="state-province" error={errors.state_province}>
                                    <Input id="state-province" value={data.state_province} onChange={(event) => setData('state_province', event.target.value)} />
                                </Field>
                                <Field label="Postal Code" id="postal-code" error={errors.postal_code}>
                                    <Input id="postal-code" value={data.postal_code} onChange={(event) => setData('postal_code', event.target.value)} />
                                </Field>
                            </div>

                            <Field label="Report Footer" id="report-footer" error={errors.report_footer}>
                                <textarea
                                    id="report-footer"
                                    value={data.report_footer}
                                    onChange={(event) => setData('report_footer', event.target.value)}
                                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                            </Field>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImagePlus className="h-5 w-5 text-primary" />
                                    Branding Logo
                                </CardTitle>
                                <CardDescription>Displayed in the app shell and available to generated report outputs.</CardDescription>
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
                                        {isDragActive ? 'Drop the logo here...' : 'Drag and drop logo here, or click to upload'}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP or SVG. Max 3MB.</p>
                                    {isUploading ? <p className="mt-2 text-xs text-primary">Uploading...</p> : null}
                                </div>

                                {logoError ? <p className="text-sm text-destructive">{logoError}</p> : null}

                                <div className="rounded-lg border bg-muted/10 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                        Current Logo
                                    </div>
                                    {logoUrl ? (
                                        <div className="flex h-20 items-center justify-center rounded-md border bg-background">
                                            <img src={logoUrl} alt="Current system logo" className="max-h-14 max-w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="flex h-20 items-center justify-center rounded-md border bg-background text-sm text-muted-foreground">
                                            Default logo is active.
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                                        <Droplets className="mr-2 h-4 w-4" />
                                        Refresh Preview
                                    </Button>
                                    <Button type="button" variant="outline" disabled={!logoUrl} onClick={() => router.delete(route('settings.logo.destroy'), { preserveScroll: true })}>
                                        <CircleOff className="mr-2 h-4 w-4" />
                                        Reset Logo
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PaletteIcon className="h-5 w-5 text-primary" />
                                    Interface Colors
                                </CardTitle>
                                <CardDescription>Local browser palette controls for the administrative interface.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {paletteFields.map((field) => (
                                    <div key={field.key} className="grid gap-2 sm:grid-cols-[1fr_72px_110px] sm:items-center">
                                        <div>
                                            <Label htmlFor={`palette-${field.key}`}>{field.label}</Label>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
                                        </div>
                                        <Input
                                            id={`palette-${field.key}`}
                                            type="color"
                                            value={palette[field.key]}
                                            onChange={(event) => {
                                                const next = event.target.value.toUpperCase();
                                                setDrafts((current) => ({ ...current, [field.key]: next }));
                                                updateColor(field.key, next);
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

                                <Button type="button" variant="outline" onClick={() => { resetPalette(); setDrafts(DEFAULT_PALETTE); }}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset Colors
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            SMTP Email Notifications
                        </CardTitle>
                        <CardDescription>Database-backed email settings used by password, onboarding, and appraisal workflow notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <label className="flex items-center gap-3 rounded-lg border bg-muted/10 px-4 py-3">
                            <Checkbox checked={data.mail_notifications_enabled} onCheckedChange={(checked) => setData('mail_notifications_enabled', checked === true)} />
                            <span>
                                <span className="block text-sm font-medium text-foreground">Enable SMTP notifications</span>
                                <span className="text-xs text-muted-foreground">When disabled, Laravel will use the environment mail configuration.</span>
                            </span>
                        </label>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Field label="SMTP Host" id="smtp-host" error={errors.smtp_host}>
                                <Input id="smtp-host" value={data.smtp_host} onChange={(event) => setData('smtp_host', event.target.value)} />
                            </Field>
                            <Field label="Port" id="smtp-port" error={errors.smtp_port}>
                                <Input id="smtp-port" inputMode="numeric" value={data.smtp_port} onChange={(event) => setData('smtp_port', event.target.value)} />
                            </Field>
                            <Field label="Encryption" id="smtp-encryption" error={errors.smtp_encryption}>
                                <select
                                    id="smtp-encryption"
                                    value={data.smtp_encryption}
                                    onChange={(event) => setData('smtp_encryption', event.target.value)}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    <option value="tls">TLS</option>
                                    <option value="ssl">SSL</option>
                                    <option value="starttls">STARTTLS</option>
                                    <option value="none">None</option>
                                </select>
                            </Field>
                            <Field label="Username" id="smtp-username" error={errors.smtp_username}>
                                <Input id="smtp-username" value={data.smtp_username} onChange={(event) => setData('smtp_username', event.target.value)} />
                            </Field>
                            <Field label={settings.smtp_password_set ? 'Password (saved)' : 'Password'} id="smtp-password" error={errors.smtp_password}>
                                <Input id="smtp-password" type="password" value={data.smtp_password} placeholder={settings.smtp_password_set ? 'Leave blank to keep current password' : ''} onChange={(event) => setData('smtp_password', event.target.value)} />
                            </Field>
                            <Field label="From Address" id="mail-from-address" error={errors.mail_from_address}>
                                <Input id="mail-from-address" type="email" value={data.mail_from_address} onChange={(event) => setData('mail_from_address', event.target.value)} />
                            </Field>
                            <Field label="From Name" id="mail-from-name" error={errors.mail_from_name}>
                                <Input id="mail-from-name" value={data.mail_from_name} onChange={(event) => setData('mail_from_name', event.target.value)} />
                            </Field>
                            <Field label="Reply-To Address" id="mail-reply-to-address" error={errors.mail_reply_to_address}>
                                <Input id="mail-reply-to-address" type="email" value={data.mail_reply_to_address} onChange={(event) => setData('mail_reply_to_address', event.target.value)} />
                            </Field>
                            <Field label="Reply-To Name" id="mail-reply-to-name" error={errors.mail_reply_to_name}>
                                <Input id="mail-reply-to-name" value={data.mail_reply_to_name} onChange={(event) => setData('mail_reply_to_name', event.target.value)} />
                            </Field>
                        </div>

                        <div className="flex flex-col gap-3 rounded-lg border bg-muted/10 p-4 md:flex-row md:items-end">
                            <Field label="Send Test Email" id="test-email" error={testEmailError}>
                                <Input id="test-email" type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="admin@example.com" />
                            </Field>
                            <Button type="button" variant="outline" onClick={sendTestEmail}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Test
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Save All Settings
                    </Button>
                </div>
            </form>
                ) : null}
            </div>
        </AppLayout>
    );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string | null; children: React.ReactNode }) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error ?? undefined} />
        </div>
    );
}
