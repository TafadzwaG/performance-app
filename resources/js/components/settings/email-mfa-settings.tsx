import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';

type Props = {
    enabled: boolean;
    enabledAt?: string | null;
};

export default function EmailMfaSettings({ enabled, enabledAt }: Props) {
    const passwordRef = useRef<HTMLInputElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'enable' | 'disable'>('enable');
    const [processing, setProcessing] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const openDialog = (mode: 'enable' | 'disable') => {
        setDialogMode(mode);
        setPasswordError(null);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setPasswordError(null);
        setProcessing(false);

        if (passwordRef.current) {
            passwordRef.current.value = '';
        }
    };

    const confirm = () => {
        const currentPassword = passwordRef.current?.value ?? '';

        if (!currentPassword) {
            setPasswordError('Enter your password to continue.');
            return;
        }

        setProcessing(true);
        setPasswordError(null);

        const options = {
            preserveScroll: true,
            onError: (errors: Record<string, string>) => {
                setPasswordError(errors.current_password ?? 'Unable to update email verification.');
                setProcessing(false);

                if (passwordRef.current) {
                    passwordRef.current.value = '';
                }
            },
            onSuccess: () => closeDialog(),
            onFinish: () => setProcessing(false),
        };

        if (dialogMode === 'enable') {
            router.post(route('email-mfa.enable'), { current_password: currentPassword }, options);
            return;
        }

        router.delete(route('email-mfa.disable'), { data: { current_password: currentPassword }, ...options });
    };

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-medium text-foreground">Email verification (MFA)</h3>
                        <Badge variant={enabled ? 'secondary' : 'outline'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        When enabled, a 6-digit code is emailed to you after you enter your password at sign-in.
                    </p>
                    {enabled && enabledAt ? (
                        <p className="text-xs text-muted-foreground">Enabled on {new Date(enabledAt).toLocaleString()}.</p>
                    ) : null}
                </div>

                {enabled ? (
                    <Button type="button" variant="outline" onClick={() => openDialog('disable')}>
                        Disable
                    </Button>
                ) : (
                    <Button type="button" onClick={() => openDialog('enable')}>
                        Enable
                    </Button>
                )}
            </div>

            <AlertDialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dialogMode === 'enable' ? 'Enable email verification?' : 'Disable email verification?'}</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-left text-sm text-muted-foreground">
                                {dialogMode === 'enable' ? (
                                    <p>
                                        Each sign-in will require a one-time code sent to your account email after your password is accepted.
                                    </p>
                                ) : (
                                    <p>Your account will only require your password to sign in. Existing pending codes will be invalidated.</p>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email-mfa-password">Your password</Label>
                                    <PasswordInput
                                        ref={passwordRef}
                                        id="email-mfa-password"
                                        name="current_password"
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        disabled={processing}
                                    />
                                    <p className="text-xs">Your password is only used to confirm this change and is not stored.</p>
                                    <InputError message={passwordError ?? undefined} />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button" disabled={processing}>
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            variant={dialogMode === 'disable' ? 'destructive' : 'default'}
                            disabled={processing}
                            onClick={confirm}
                        >
                            {dialogMode === 'enable' ? 'Enable' : 'Disable'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
