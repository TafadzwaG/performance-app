import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: string | boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Sign in to your appraisal workspace"
            description="Access employee reviews, goal tracking, feedback cycles, and performance insights."
        >
            <Head title="Sign in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    {status && (
                        <div className="rounded-lg border border-secondary bg-secondary/40 px-4 py-3 text-sm font-medium text-foreground">
                            {status}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="email">Work email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="name@company.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>

                        <PasswordInput
                            id="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Enter your password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            tabIndex={3}
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                        />
                        <Label htmlFor="remember">Keep me signed in</Label>
                    </div>

                    <Button type="submit" className="mt-2 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Sign in
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    New to the platform?{' '}
                    <TextLink href={route('register')} tabIndex={6}>
                        Create an account
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
