import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, LogIn, MoveRight } from 'lucide-react';
import { FormEventHandler } from 'react';

import { GetStartedPopover } from '@/components/get-started-popover';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { cn } from '@/lib/utils';
import AuthLayout from '@/layouts/auth-layout';

type LoginMethod = 'employee_number' | 'email';

interface LoginForm {
    login_method: LoginMethod;
    employee_number: string;
    email: string;
    password: string;
    remember: boolean;
    [key: string]: string | boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

const loginMethods: Array<{ value: LoginMethod; label: string }> = [
    { value: 'email', label: 'Email' },
    { value: 'employee_number', label: 'Employee number' },
];

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        login_method: 'email',
        employee_number: '',
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

    const switchLoginMethod = (method: LoginMethod) => {
        setData('login_method', method);
    };

    return (
        <AuthLayout
            title="Sign in to your workspace."
            description="Access employee reviews, goal tracking, feedback cycles, and performance insights — all held in one patient place."
        >
            <Head title="Sign in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    {status && (
                        <div className="border-brand-sand/40 bg-brand-sand/15 text-foreground rounded-md border px-4 py-3 text-sm font-medium">
                            <span className="font-mono-brand mr-2 text-[10px] tracking-[0.2em] uppercase">
                                Notice
                            </span>
                            {status}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase">
                            Sign in with
                        </Label>
                        <div className="bg-muted/40 border-foreground/10 grid grid-cols-2 gap-1 rounded-lg border p-1">
                            {loginMethods.map((method) => (
                                <button
                                    key={method.value}
                                    type="button"
                                    tabIndex={1}
                                    onClick={() => switchLoginMethod(method.value)}
                                    className={cn(
                                        'rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                                        data.login_method === method.value
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-foreground/65 hover:text-foreground',
                                    )}
                                >
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {data.login_method === 'email' ? (
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase">
                                Work email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={2}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="name@company.com"
                                className="bg-background border-foreground/15 focus-visible:border-brand-sand h-11 text-[14px]"
                            />
                            <InputError message={errors.email} />
                        </div>
                    ) : (
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="employee_number"
                                className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase"
                            >
                                Employee number
                            </Label>
                            <Input
                                id="employee_number"
                                type="text"
                                required
                                autoFocus
                                tabIndex={2}
                                autoComplete="username"
                                value={data.employee_number}
                                onChange={(e) => setData('employee_number', e.target.value)}
                                placeholder="EMP-1001"
                                className="bg-background border-foreground/15 focus-visible:border-brand-sand h-11 text-[14px]"
                            />
                            <InputError message={errors.employee_number} />
                            {canResetPassword && (
                                <p className="text-foreground/60 text-[12px] leading-5">
                                    Forgot your password?{' '}
                                    <TextLink href={route('password.request')} className="text-[12px]">
                                        Reset it using your work email
                                    </TextLink>
                                    .
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid gap-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase">
                                Password
                            </Label>
                            {canResetPassword && data.login_method === 'email' && (
                                <TextLink
                                    href={route('password.request')}
                                    className="text-foreground/65 hover:text-brand-pine text-[11px]"
                                    tabIndex={5}
                                >
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>

                        <PasswordInput
                            id="password"
                            required
                            tabIndex={3}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Enter your password"
                            className="bg-background border-foreground/15 focus-visible:border-brand-sand h-11 text-[14px]"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <Checkbox
                            id="remember"
                            name="remember"
                            tabIndex={4}
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                        />
                        <Label htmlFor="remember" className="text-foreground/75 text-[13px]">
                            Keep me signed in
                        </Label>
                    </div>

                    <Button type="submit" size="xl" className="mt-3 w-full" tabIndex={5} disabled={processing}>
                        {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                        Sign in
                        {!processing ? <MoveRight className="h-4 w-4" /> : null}
                    </Button>
                </div>

                <div className="border-foreground/10 flex flex-col gap-4 border-t pt-5">
                    <div className="flex items-center justify-between">
                        <p className="text-foreground/65 text-[13px]">
                            New to the platform?{' '}
                            <TextLink
                                href={route('register')}
                                tabIndex={6}
                                className="text-foreground hover:text-brand-pine decoration-brand-sand decoration-2"
                            >
                                Create an account
                            </TextLink>
                        </p>

                        <GetStartedPopover triggerVariant="compact" />
                    </div>

                    <div className="font-mono-brand text-foreground/45 flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase">
                        <span>Trouble signing in?</span>
                        <span className="dotted-divider h-px flex-1 text-foreground/30" />
                        <a href="mailto:support@performance.studio" className="hover:text-foreground/80 transition-colors">
                            support@performance.studio
                        </a>
                    </div>
                </div>
            </form>
        </AuthLayout>
    );
}
