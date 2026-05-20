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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import type { AccessUserRecord } from '@/types/performance';
import { router } from '@inertiajs/react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

type ImpactItem = {
    key: string;
    label: string;
    count: number;
    description: string;
};

type ClearedItem = {
    label: string;
    count: number;
    description: string;
};

type DeletionImpact = {
    user: {
        id: number;
        name: string;
        email: string;
        employee_number?: string | null;
    };
    items: ImpactItem[];
    cleared: ClearedItem[];
    totals: {
        records: number;
    };
};

type Props = {
    user: AccessUserRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteUserDialog({ user, open, onOpenChange }: Props) {
    const passwordRef = useRef<HTMLInputElement>(null);
    const [impact, setImpact] = useState<DeletionImpact | null>(null);
    const [loadingImpact, setLoadingImpact] = useState(false);
    const [impactError, setImpactError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const resetDialog = () => {
        setImpact(null);
        setImpactError(null);
        setPasswordError(null);
        setSubmitting(false);

        if (passwordRef.current) {
            passwordRef.current.value = '';
        }
    };

    useEffect(() => {
        if (!open || !user) {
            resetDialog();
            return;
        }

        const controller = new AbortController();
        setLoadingImpact(true);
        setImpactError(null);
        setImpact(null);

        fetch(route('access.users.deletion_impact', { user: user.id }), {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Unable to load deletion details.');
                }

                return response.json() as Promise<DeletionImpact>;
            })
            .then((payload) => setImpact(payload))
            .catch((error: Error) => {
                if (error.name !== 'AbortError') {
                    setImpactError(error.message || 'Unable to load deletion details.');
                }
            })
            .finally(() => setLoadingImpact(false));

        return () => controller.abort();
    }, [open, user?.id]);

    const submitDelete = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!user) {
            return;
        }

        const currentPassword = passwordRef.current?.value ?? '';

        setSubmitting(true);
        setPasswordError(null);

        router.delete(route('access.users.destroy', { user: user.id }), {
            data: { current_password: currentPassword },
            preserveScroll: true,
            onError: (errors) => {
                setPasswordError(typeof errors.current_password === 'string' ? errors.current_password : 'Deletion failed.');
                setSubmitting(false);

                if (passwordRef.current) {
                    passwordRef.current.value = '';
                    passwordRef.current.focus();
                }
            },
            onSuccess: () => {
                resetDialog();
                onOpenChange(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetDialog();
        }

        onOpenChange(nextOpen);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <form onSubmit={submitDelete}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete user permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 text-left text-sm text-muted-foreground">
                                {user ? (
                                    <p>
                                        You are about to delete <strong className="text-foreground">{user.name}</strong> (
                                        {user.email}
                                        {user.employee_profile?.employee_number
                                            ? ` · ${user.employee_profile.employee_number}`
                                            : ''}
                                        ). This action cannot be undone.
                                    </p>
                                ) : null}

                                {loadingImpact ? (
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Calculating associated records...
                                    </div>
                                ) : null}

                                {impactError ? <p className="text-destructive">{impactError}</p> : null}

                                {impact ? (
                                    <div className="space-y-4">
                                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                                            <p className="font-medium text-foreground">Records that will be deleted</p>
                                            <ul className="mt-2 space-y-2">
                                                {impact.items.map((item) => (
                                                    <li key={item.key} className="flex gap-2">
                                                        <span className="min-w-[2rem] font-semibold text-foreground">{item.count}</span>
                                                        <span>
                                                            <span className="font-medium text-foreground">{item.label}</span>
                                                            <span className="block text-xs">{item.description}</span>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {impact.cleared.length > 0 ? (
                                            <div className="rounded-lg border bg-muted/20 p-3">
                                                <p className="font-medium text-foreground">References that will be cleared</p>
                                                <ul className="mt-2 space-y-2">
                                                    {impact.cleared.map((item) => (
                                                        <li key={item.label} className="flex gap-2">
                                                            <span className="min-w-[2rem] font-semibold text-foreground">{item.count}</span>
                                                            <span>
                                                                <span className="font-medium text-foreground">{item.label}</span>
                                                                <span className="block text-xs">{item.description}</span>
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div className="space-y-2">
                                    <Label htmlFor="delete-user-current-password">Your password</Label>
                                    <PasswordInput
                                        ref={passwordRef}
                                        id="delete-user-current-password"
                                        name="current_password"
                                        autoComplete="current-password"
                                        placeholder="Enter your password to confirm"
                                        disabled={submitting || loadingImpact}
                                    />
                                    <p className="text-xs">Your password is only used to confirm this action and is not stored.</p>
                                    <InputError message={passwordError ?? undefined} />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel type="button" disabled={submitting}>
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={submitting || loadingImpact || !impact || !!impactError}
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete user and data
                        </Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
