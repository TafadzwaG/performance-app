import HeadingSmall from '@/components/heading-small';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import type { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Access settings',
        href: '/settings/access',
    },
];

interface AccessSettingsProps {
    openRegistrationEnabled: boolean;
    autoApproveRegistrations: boolean;
}

export default function AccessSettings({ openRegistrationEnabled, autoApproveRegistrations }: AccessSettingsProps) {
    const { flash } = usePage<SharedData>().props;
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        open_registration_enabled: openRegistrationEnabled,
        auto_approve_registrations: autoApproveRegistrations,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        put(route('settings.access.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Access settings" />

            <SettingsLayout>
                <div className="flex flex-col gap-6">
                    <HeadingSmall title="Login access" description="Control whether visitors can self-register from the sign-in screen." />

                    {flash.success ? (
                        <Alert>
                            <CheckCircle2 />
                            <AlertTitle>Settings saved</AlertTitle>
                            <AlertDescription>{flash.success}</AlertDescription>
                        </Alert>
                    ) : null}

                    <form onSubmit={submit}>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="text-muted-foreground size-5" />
                                    <CardTitle className="text-base">Public signup</CardTitle>
                                </div>
                                <CardDescription>
                                    Control whether visitors can create accounts and whether new accounts require administrator approval.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FieldGroup>
                                    <Field
                                        orientation="horizontal"
                                        data-invalid={Boolean(errors.open_registration_enabled)}
                                        className="rounded-lg border p-4"
                                    >
                                        <FieldContent>
                                            <FieldLabel htmlFor="open-registration-enabled">Allow signup on login screen</FieldLabel>
                                            <FieldDescription>
                                                Shows a &quot;Create an account&quot; link on the sign-in page that opens the registration form.
                                            </FieldDescription>
                                            <FieldError>{errors.open_registration_enabled}</FieldError>
                                        </FieldContent>
                                        <Switch
                                            id="open-registration-enabled"
                                            checked={data.open_registration_enabled}
                                            onCheckedChange={(checked) => setData('open_registration_enabled', checked)}
                                            aria-invalid={Boolean(errors.open_registration_enabled)}
                                        />
                                    </Field>
                                    <Field
                                        orientation="horizontal"
                                        data-invalid={Boolean(errors.auto_approve_registrations)}
                                        className="rounded-lg border p-4"
                                    >
                                        <FieldContent>
                                            <FieldLabel htmlFor="auto-approve-registrations">Automatically approve new signups</FieldLabel>
                                            <FieldDescription>
                                                New signup accounts become active immediately and do not require approval from a super admin. This
                                                only applies while public signup is enabled.
                                            </FieldDescription>
                                            <FieldError>{errors.auto_approve_registrations}</FieldError>
                                        </FieldContent>
                                        <Switch
                                            id="auto-approve-registrations"
                                            checked={data.auto_approve_registrations}
                                            onCheckedChange={(checked) => setData('auto_approve_registrations', checked)}
                                            aria-invalid={Boolean(errors.auto_approve_registrations)}
                                        />
                                    </Field>
                                </FieldGroup>
                            </CardContent>
                            <CardFooter className="flex items-center gap-3">
                                <Button type="submit" disabled={processing}>
                                    Save access settings
                                </Button>
                                {recentlySuccessful ? <span className="text-muted-foreground text-sm">Saved.</span> : null}
                            </CardFooter>
                        </Card>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
