import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail, MoveRight, RefreshCw } from 'lucide-react';
import { type FormEventHandler } from 'react';

interface Props {
    email: string;
    status?: string;
}

export default function TwoFactorChallenge({ email, status }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('two-factor.verify'), {
            onFinish: () => setData('code', ''),
        });
    };

    const resendCode = () => {
        post(route('two-factor.resend'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout
            title="Check your email."
            description="We sent a one-time verification code to complete your sign-in."
        >
            <Head title="Verify sign-in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    {status ? (
                        <div className="border-brand-sand/40 bg-brand-sand/15 text-foreground rounded-md border px-4 py-3 text-sm font-medium">
                            {status}
                        </div>
                    ) : null}

                    <div className="rounded-lg border border-foreground/10 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                            <Mail className="h-4 w-4 text-primary" />
                            Code sent to {email}
                        </div>
                        <p className="mt-1 text-xs">The code expires in 10 minutes.</p>
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="code" className="font-mono-brand text-foreground/70 text-[10px] tracking-[0.22em] uppercase">
                            Verification code
                        </Label>
                        <Input
                            id="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            required
                            maxLength={6}
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="bg-background border-foreground/15 focus-visible:border-brand-sand h-11 text-center text-lg tracking-[0.35em]"
                        />
                        <InputError message={errors.code} />
                    </div>

                    <Button type="submit" size="xl" className="w-full" disabled={processing || data.code.length !== 6}>
                        {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                        Verify and continue
                        {!processing ? <MoveRight className="h-4 w-4" /> : null}
                    </Button>

                    <Button type="button" variant="outline" className="w-full" onClick={resendCode} disabled={processing}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend code
                    </Button>
                </div>

                <div className="border-foreground/10 border-t pt-5 text-center text-sm text-muted-foreground">
                    <TextLink href={route('login')}>Back to sign in</TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
