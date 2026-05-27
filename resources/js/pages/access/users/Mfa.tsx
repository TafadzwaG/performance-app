import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/date-utils';
import type { BreadcrumbItem } from '@/types';
import type { AccessUserRecord, Paginated } from '@/types/performance';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, LockKeyhole, Search, ShieldCheck, ShieldOff } from 'lucide-react';
import type { FormEvent } from 'react';

const ALL_FILTER_VALUE = 'all';

interface Props {
    users?: Paginated<AccessUserRecord> | null;
    filters?: {
        search?: string;
        status?: 'all' | 'enabled' | 'disabled';
    } | null;
    globalMfaRequired: boolean;
    canManageUserMfa: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Users', href: route('access.users.index') },
    { title: 'MFA Settings', href: route('access.users.mfa.index') },
];

export default function UserMfaIndex({ users, filters, globalMfaRequired, canManageUserMfa }: Props) {
    const safeUsers: Paginated<AccessUserRecord> = {
        data: users?.data ?? [],
        current_page: users?.current_page ?? 1,
        last_page: users?.last_page ?? 1,
        per_page: users?.per_page ?? 10,
        total: users?.total ?? 0,
        from: users?.from ?? null,
        to: users?.to ?? null,
        path: users?.path ?? route('access.users.mfa.index'),
        links: users?.links ?? [],
    };

    const searchForm = useForm({
        search: filters?.search ?? '',
        status: filters?.status ?? 'all',
    });

    const applyFilters = (overrides: Record<string, string | undefined> = {}) => {
        router.get(
            route('access.users.mfa.index'),
            {
                search: searchForm.data.search || undefined,
                status: searchForm.data.status === 'all' ? undefined : searchForm.data.status,
                ...overrides,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilters();
    };

    const toggleMfa = (user: AccessUserRecord, enabled: boolean) => {
        if (globalMfaRequired || !canManageUserMfa) {
            return;
        }

        router.put(
            route('access.users.mfa.update', { user: user.id }),
            { enabled },
            {
                preserveScroll: true,
            },
        );
    };

    const enabledCount = safeUsers.data.filter((user) => user.email_mfa_enabled).length;

    return (
        <PerformancePage
            title="MFA Settings"
            description="Manage email one-time-password security for user sign-ins."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <Button asChild variant="outline">
                    <Link href={route('access.users.index')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Users
                    </Link>
                </Button>
            }
        >
            <Head title="User MFA Settings" />

            <div className="space-y-6">
                <Card>
                    <CardHeader className="gap-4">
                        <div className="inline-flex w-fit items-center gap-2 rounded-md border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Email MFA
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-3xl font-semibold tracking-tight">MFA Administration</CardTitle>
                                <CardDescription>
                                    Control which users receive an email OTP after password sign-in when global enforcement is off.
                                </CardDescription>
                            </div>

                            <Badge variant={globalMfaRequired ? 'secondary' : 'outline'} className="w-fit">
                                {globalMfaRequired ? 'Globally Enforced' : 'Per-user Controls Active'}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {globalMfaRequired ? (
                    <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="flex items-start gap-3 p-4">
                            <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-foreground">Global MFA is currently enforced.</div>
                                <p className="text-sm text-muted-foreground">
                                    Every approved user will receive an email OTP during sign-in. Disable the global setting before changing individual user MFA preferences.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Search & Filter
                                </CardDescription>
                                <CardTitle className="text-lg">Find users</CardTitle>
                            </div>

                            <Badge variant="outline">
                                {enabledCount} enabled on this page
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={submitSearch} className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end">
                            <div className="space-y-2">
                                <label htmlFor="mfa-search" className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="mfa-search"
                                        value={searchForm.data.search}
                                        onChange={(event) => searchForm.setData('search', event.target.value)}
                                        className="pl-9"
                                        placeholder="Search by name or email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                    MFA Status
                                </label>
                                <Select
                                    value={searchForm.data.status || ALL_FILTER_VALUE}
                                    onValueChange={(next) => {
                                        const value = next === ALL_FILTER_VALUE ? 'all' : next;
                                        searchForm.setData('status', value);
                                        applyFilters({ status: value === 'all' ? undefined : value });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_FILTER_VALUE}>All users</SelectItem>
                                        <SelectItem value="enabled">MFA enabled</SelectItem>
                                        <SelectItem value="disabled">MFA disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>User MFA Controls</CardTitle>
                        <CardDescription>Toggle email OTP requirements for individual users.</CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] text-left">
                                <thead className="border-y bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">User</th>
                                        <th className="px-6 py-3 font-medium">Roles</th>
                                        <th className="px-6 py-3 font-medium">Account</th>
                                        <th className="px-6 py-3 font-medium">MFA Status</th>
                                        <th className="px-6 py-3 text-right font-medium">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {safeUsers.data.length > 0 ? (
                                        safeUsers.data.map((user) => {
                                            const enabled = !!user.email_mfa_enabled;
                                            const effectiveEnabled = globalMfaRequired || enabled;
                                            const locked = globalMfaRequired || !canManageUserMfa;

                                            return (
                                                <tr key={user.id}>
                                                    <td className="px-6 py-5">
                                                        <div className="space-y-1">
                                                            <Link
                                                                href={route('access.users.show', { user: user.id })}
                                                                className="font-medium text-foreground hover:underline"
                                                            >
                                                                {user.name}
                                                            </Link>
                                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(user.roles ?? []).length > 0 ? (
                                                                (user.roles ?? []).map((role) => (
                                                                    <Badge key={role.id} variant="outline">
                                                                        {role.name}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">No roles</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <Badge variant={user.is_approved ? 'secondary' : 'outline'}>
                                                            {user.is_approved ? 'Approved' : 'Pending'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="space-y-1.5">
                                                            <Badge variant={effectiveEnabled ? 'secondary' : 'outline'}>
                                                                {effectiveEnabled ? 'OTP Required' : 'OTP Not Required'}
                                                            </Badge>
                                                            {globalMfaRequired ? (
                                                                <div className="text-xs text-muted-foreground">Enforced globally</div>
                                                            ) : enabled && user.email_mfa_enabled_at ? (
                                                                <div className="text-xs text-muted-foreground">
                                                                    Enabled {formatDateTime(user.email_mfa_enabled_at)}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end">
                                                            <label className="inline-flex items-center gap-3 rounded-md border bg-background px-3 py-2 text-sm">
                                                                <Checkbox
                                                                    checked={effectiveEnabled}
                                                                    disabled={locked}
                                                                    onCheckedChange={(checked) => toggleMfa(user, checked === true)}
                                                                />
                                                                <span className="font-medium">
                                                                    {effectiveEnabled ? 'Enabled' : 'Disabled'}
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-14 text-center">
                                                <div className="mx-auto max-w-md space-y-2">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                                                        <ShieldOff className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-base font-semibold text-foreground">No users found</h3>
                                                    <p className="text-sm text-muted-foreground">Try adjusting your search or MFA status filter.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {safeUsers.links.length > 0 ? (
                            <div className="flex flex-col gap-4 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Showing {safeUsers.from ?? 0} to {safeUsers.to ?? safeUsers.data.length} of{' '}
                                    <span className="font-medium text-foreground">{safeUsers.total}</span> users
                                </div>

                                <PaginationLinks paginated={safeUsers} />
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
