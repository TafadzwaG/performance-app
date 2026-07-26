import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowRight, Building2, Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

interface OrganizationOption {
    id: number;
    name: string;
    slug: string;
    is_default: boolean;
}

interface CurrentOrganization {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    organizations: OrganizationOption[];
    currentOrganization: CurrentOrganization | null;
    canTransferMembership: boolean;
}

export default function SelectOrganization({ organizations, currentOrganization, canTransferMembership }: Props) {
    const [switching, setSwitching] = useState<number | null>(null);
    const [transferTarget, setTransferTarget] = useState<OrganizationOption | null>(null);

    const choose = (organization: OrganizationOption) => {
        if (organization.id === currentOrganization?.id) {
            setSwitching(organization.id);
            router.post(route('organizations.switch'), { organization_id: organization.id }, { onFinish: () => setSwitching(null) });

            return;
        }

        if (canTransferMembership) {
            setTransferTarget(organization);

            return;
        }

        setSwitching(organization.id);
        router.post(route('organizations.switch'), { organization_id: organization.id }, { onFinish: () => setSwitching(null) });
    };

    const confirmTransfer = () => {
        if (!transferTarget) {
            return;
        }

        setSwitching(transferTarget.id);
        router.post(
            route('organizations.transfer'),
            { organization_id: transferTarget.id },
            {
                onFinish: () => {
                    setSwitching(null);
                    setTransferTarget(null);
                },
            },
        );
    };

    return (
        <AuthLayout title="Choose an organization" description="Select the organization you want to work in for this session.">
            <Head title="Choose organization" />
            <div className="grid gap-4">
                {organizations.length > 0 ? (
                    <p className="text-muted-foreground text-center text-xs tracking-[0.18em] uppercase">
                        {organizations.length} {organizations.length === 1 ? 'organization' : 'organizations'} available
                    </p>
                ) : null}

                <div className="grid gap-3">
                    {organizations.map((organization) => {
                        const isCurrent = organization.id === currentOrganization?.id;

                        return (
                            <Button
                                key={organization.id}
                                type="button"
                                variant={isCurrent ? 'default' : 'outline'}
                                className="h-auto justify-start gap-3 px-4 py-4 text-left"
                                disabled={switching !== null}
                                onClick={() => choose(organization)}
                            >
                                {switching === organization.id ? (
                                    <LoaderCircle className="size-5 animate-spin" />
                                ) : isCurrent ? (
                                    <ArrowRight className="size-5" />
                                ) : (
                                    <Building2 className="size-5" />
                                )}
                                <span className="flex-1">
                                    <span className="block font-medium">{isCurrent ? `Continue with ${organization.name}` : organization.name}</span>
                                    <span className={isCurrent ? 'text-primary-foreground/80 block text-xs' : 'text-muted-foreground block text-xs'}>
                                        {organization.slug}
                                        {organization.is_default ? ' | Default organization' : ''}
                                    </span>
                                </span>
                                {isCurrent ? <Check className="size-4" aria-label="Current organization" /> : null}
                            </Button>
                        );
                    })}
                </div>

                {organizations.length === 0 ? (
                    <p className="text-muted-foreground rounded-md border p-4 text-sm">No active organizations are available.</p>
                ) : null}
            </div>

            <AlertDialog open={transferTarget !== null} onOpenChange={(open) => !open && !switching && setTransferTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Transfer membership to {transferTarget?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {currentOrganization
                                ? `Your access to ${currentOrganization.name} will be suspended and your active membership will move to ${transferTarget?.name}.`
                                : `A new active membership will be created for ${transferTarget?.name}.`}
                            {' You can transfer back later from this page.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={switching !== null}>Cancel</AlertDialogCancel>
                        <AlertDialogAction disabled={switching !== null} onClick={confirmTransfer}>
                            {switching !== null ? <LoaderCircle className="size-4 animate-spin" /> : null}
                            Transfer membership
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthLayout>
    );
}
