import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout
            title="Forgot your password?"
            description="Enter the work email linked to your account and we will send you a secure reset link."
        >
            <Head title="Forgot password" />

            <div className="space-y-6">
                {status && (
                    <div className="border-brand-sand/40 bg-brand-sand/15 text-foreground rounded-md border px-4 py-3 text-sm font-medium">
                        <span className="font-mono-brand mr-2 text-[10px] tracking-[0.2em] uppercase">
                            Notice
                        </span>
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-1.5">
                        <Label htmlFor="email" className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase">
                            Work email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="name@company.com"
                            className="bg-background border-foreground/15 focus-visible:border-brand-sand h-11 text-[14px]"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <Button className="h-11 w-full" disabled={processing}>
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Email password reset link
                    </Button>
                </form>

                <div className="text-muted-foreground text-center text-sm">
                    <span>Or, return to </span>
                    <TextLink href={route('login')}>sign in</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
