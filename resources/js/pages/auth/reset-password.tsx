import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import AuthLayout from '@/layouts/auth-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

interface ResetPasswordForm {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
    [key: string]: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Choose a new password"
            description="Use at least 8 characters with uppercase, lowercase, a number, and a symbol."
        >
            <Head title="Reset password" />

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-1.5">
                    <Label htmlFor="email" className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase">
                        Work email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={data.email}
                        readOnly
                        className="bg-muted/30 border-foreground/15 h-11 text-[14px]"
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="password" className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase">
                        New password
                    </Label>
                    <PasswordInput
                        id="password"
                        name="password"
                        required
                        autoComplete="new-password"
                        value={data.password}
                        autoFocus
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Enter a new password"
                        className="bg-background border-foreground/15 focus-visible:border-brand-sand h-11 text-[14px]"
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="password_confirmation" className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase">
                        Confirm password
                    </Label>
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        required
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Confirm your new password"
                        className="bg-background border-foreground/15 focus-visible:border-brand-sand h-11 text-[14px]"
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <Button type="submit" className="h-11 w-full" disabled={processing}>
                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Reset password
                </Button>

                <div className="text-muted-foreground text-center text-sm">
                    <span>Remembered it? </span>
                    <TextLink href={route('login')}>Return to sign in</TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
