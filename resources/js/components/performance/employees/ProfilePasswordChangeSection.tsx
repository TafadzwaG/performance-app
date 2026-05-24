import InputError from '@/components/input-error';
import PasswordFieldWithStrength from '@/components/password-field-with-strength';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { KeyRound, Save } from 'lucide-react';
import type { FormEvent } from 'react';

export default function ProfilePasswordChangeSection() {
    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const applySuggestedPassword = (password: string) => {
        setData('password', password);
        setData('password_confirmation', password);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/30">
                        <KeyRound className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Account security
                        </CardDescription>
                        <CardTitle>Change password</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="current_password">Current password</Label>
                        <PasswordInput
                            id="current_password"
                            value={data.current_password}
                            onChange={(event) => setData('current_password', event.target.value)}
                            autoComplete="current-password"
                            placeholder="Enter your current password"
                        />
                        <InputError message={errors.current_password} />
                    </div>

                    <PasswordFieldWithStrength
                        id="password"
                        label="New password"
                        value={data.password}
                        confirmation={data.password_confirmation}
                        error={errors.password}
                        showConfirmationMatch
                        onChange={(value) => setData('password', value)}
                        onSuggest={applySuggestedPassword}
                    />

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm new password</Label>
                        <PasswordInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(event) => setData('password_confirmation', event.target.value)}
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <Button type="submit" variant="outline" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Updating…' : 'Update password'}
                        </Button>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-muted-foreground">Password updated.</p>
                        </Transition>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
