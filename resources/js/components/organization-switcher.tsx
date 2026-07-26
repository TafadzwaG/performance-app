import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronsUpDown, Search, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';

export function OrganizationSwitcher() {
    const { auth, tenant } = usePage<SharedData>().props;
    const organizations = tenant?.organizations ?? [];
    const isPlatformAdmin = Boolean(auth.user?.is_platform_admin);
    const [search, setSearch] = useState('');
    const [switching, setSwitching] = useState<number | null>(null);

    if (!tenant?.current) {
        return null;
    }

    const canSwitch = isPlatformAdmin || organizations.length > 1;
    const filteredOrganizations = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return organizations;
        }

        return organizations.filter((organization) =>
            [organization.name, organization.slug].join(' ').toLowerCase().includes(query),
        );
    }, [organizations, search]);

    const switchOrganization = (organizationId: number) => {
        if (organizationId === tenant.current?.id || switching !== null) {
            return;
        }

        setSwitching(organizationId);
        router.post(
            route('organizations.switch'),
            { organization_id: organizationId },
            {
                preserveState: false,
                preserveScroll: false,
                onFinish: () => setSwitching(null),
            },
        );
    };

    if (!canSwitch) {
        return (
            <div className="bg-muted/30 hidden h-9 max-w-[220px] items-center gap-2 rounded-lg border px-3 text-sm sm:flex">
                <Building2 className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate font-medium">{tenant.current.name}</span>
            </div>
        );
    }

    return (
        <DropdownMenu onOpenChange={(open) => !open && setSearch('')}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'h-9 max-w-[260px] justify-between gap-2 px-3',
                        tenant.supportAccess && 'border-amber-400/70 bg-amber-50/60 dark:bg-amber-950/20',
                    )}
                    aria-label="Switch organization"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <Building2 className="size-4 shrink-0" />
                        <span className="flex min-w-0 flex-col items-start leading-tight">
                            <span className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">Organization</span>
                            <span className="max-w-[150px] truncate text-sm font-medium">{tenant.current.name}</span>
                        </span>
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <span>{isPlatformAdmin ? 'Switch organization context' : 'Your organizations'}</span>
                        {tenant.supportAccess ? (
                            <Badge variant="outline" className="border-amber-300 text-amber-900 dark:text-amber-100">
                                Support
                            </Badge>
                        ) : null}
                    </div>
                    <p className="text-muted-foreground text-xs font-normal">
                        Changing organization reloads permissions, navigation, and tenant data for the whole app.
                    </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.length > 5 ? (
                    <div className="px-2 pb-2">
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search organizations..."
                                className="h-8 pl-8"
                            />
                        </div>
                    </div>
                ) : null}
                <div className="max-h-72 overflow-y-auto">
                    {filteredOrganizations.length > 0 ? (
                        filteredOrganizations.map((organization) => (
                            <DropdownMenuItem
                                key={organization.id}
                                className="cursor-pointer"
                                disabled={switching !== null || organization.id === tenant.current?.id}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    switchOrganization(organization.id);
                                }}
                            >
                                <span className="flex-1 truncate">{organization.name}</span>
                                {switching === organization.id ? (
                                    <span className="text-muted-foreground text-xs">Switching...</span>
                                ) : organization.id === tenant.current?.id ? (
                                    <Check className="size-4" />
                                ) : null}
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="text-muted-foreground px-2 py-6 text-center text-sm">No organizations match your search.</div>
                    )}
                </div>
                {isPlatformAdmin ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={route('platform.organizations.index')} className="flex items-center gap-2">
                                <Shield className="size-4" />
                                Manage platform organizations
                            </Link>
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
