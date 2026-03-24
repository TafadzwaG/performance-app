import GeneratedCredentialsAlert from '@/components/access/users/GeneratedCredentialsAlert';
import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { AccessUserRecord, Paginated } from '@/types/performance';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Activity, Briefcase, Download, Eye, Filter, LogIn, Pencil, RotateCcw, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';

interface Props {
    users?: Paginated<AccessUserRecord> | null;
    filters?: { search?: string } | null;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function permissionTone(count: number) {
    if (count >= 8) return 'bg-foreground';
    if (count >= 3) return 'bg-foreground/70';
    return 'bg-muted-foreground/50';
}

export default function UsersIndex({ users, filters }: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Users', href: route('access.users.index') },
    ];
    const canCreateUsers = auth.permissions.includes('access.users.create');
    const canImportUsers = auth.permissions.includes('access.users.import');
    const canImpersonateUsers = auth.permissions.includes('access.users.impersonate');
    const isImpersonating = auth.impersonation?.isImpersonating ?? false;

    const safeUsers: Paginated<AccessUserRecord> = {
        data: users?.data ?? [],
        current_page: users?.current_page ?? 1,
        last_page: users?.last_page ?? 1,
        per_page: users?.per_page ?? 10,
        total: users?.total ?? 0,
        from: users?.from ?? null,
        to: users?.to ?? null,
        path: users?.path ?? route('access.users.index'),
        links: users?.links ?? [],
    };

    const searchForm = useForm({
        search: filters?.search ?? '',
    });

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        searchForm.get(route('access.users.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const usersOnPage = safeUsers.data.length;
    const linkedProfiles = safeUsers.data.filter((user) => user.employee_profile).length;
    const usersWithRoles = safeUsers.data.filter((user) => (user.roles?.length ?? 0) > 0).length;
    const totalDirectPermissions = safeUsers.data.reduce((sum, user) => sum + (user.permissions?.length ?? 0), 0);

    const startImpersonation = (user: AccessUserRecord) => {
        router.post(
            route('access.users.impersonate.store', { user: user.id }),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <PerformancePage
            title="Users"
            description="Manage account details, roles, and direct permissions."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <GeneratedCredentialsAlert credentials={flash.generatedCredentials} />

                <Card>
                    <CardHeader className="gap-4">
                        <div className="inline-flex w-fit items-center gap-2 rounded-md border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            User Directory
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-3xl font-semibold tracking-tight">Users</CardTitle>
                                <CardDescription>
                                    Manage account details, employee links, assigned roles, and direct permissions.
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {canImportUsers ? (
                                    <Button asChild type="button" variant="outline">
                                        <Link href={route('access.users.import.create')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Import Users
                                        </Link>
                                    </Button>
                                ) : null}

                                {canCreateUsers ? (
                                    <>
                                        <Button asChild type="button" variant="outline">
                                            <Link href={route('access.users.bulk_create')}>
                                                <Users className="mr-2 h-4 w-4" />
                                                Add Multiple
                                            </Link>
                                        </Button>
                                        <Button asChild type="button">
                                            <Link href={route('access.users.create')}>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Create User
                                            </Link>
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <form onSubmit={submitSearch} className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchForm.data.search}
                                    onChange={(event) => searchForm.setData('search', event.target.value)}
                                    placeholder="Search users by name, email, or employee number"
                                    className="h-11 pl-10"
                                />
                            </div>

                            <Button type="submit" variant="outline" disabled={searchForm.processing}>
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>

                            <Button asChild variant="outline">
                                <Link href={route('access.users.index')}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Link>
                            </Button>
                        </form>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            Users on this page:
                            <span className="font-medium text-foreground">{usersOnPage}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            Employee Profile
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            Roles
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            Direct Permissions
                                        </th>
                                        <th className="px-6 py-4 text-right text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {safeUsers.data.length > 0 ? (
                                        safeUsers.data.map((user) => (
                                            <tr key={user.id} className="border-t transition-colors hover:bg-muted/40">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-full border bg-muted font-medium text-foreground">
                                                            {getInitials(user.name)}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium text-foreground">{user.name}</div>
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-foreground">
                                                    {user.employee_profile?.employee_number ?? 'Not linked'}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.roles && user.roles.length > 0 ? (
                                                            user.roles.map((role) => (
                                                                <Badge key={role.id} variant="secondary">
                                                                    {role.name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">None assigned</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`h-2.5 w-2.5 rounded-full ${permissionTone(
                                                                user.permissions?.length ?? 0,
                                                            )}`}
                                                        />
                                                        <span className="font-medium text-foreground">
                                                            {user.permissions?.length ?? 0} active
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={route('access.users.show', { user: user.id })}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={route('access.users.edit', { user: user.id })}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        {canImpersonateUsers && !isImpersonating && auth.user.id !== user.id && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                title={`Impersonate ${user.name}`}
                                                                onClick={() => startImpersonation(user)}
                                                            >
                                                                <LogIn className="mr-2 h-4 w-4" />
                                                                Impersonate
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-14 text-center">
                                                <div className="mx-auto max-w-md space-y-2">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-base font-semibold text-foreground">No users found</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Try adjusting your search to find matching user records.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {safeUsers.links.length > 0 && (
                            <div className="flex flex-col gap-4 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-xs text-muted-foreground">
                                    Directory results for the current page:
                                    <span className="ml-1 font-medium text-foreground">{usersOnPage}</span>
                                </div>

                                <PaginationLinks paginated={safeUsers} />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-foreground">
                                <ShieldCheck className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm">Directory Coverage</CardTitle>
                            </div>
                            <CardDescription>Employee profile linkage across visible users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold text-foreground">{linkedProfiles}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Users linked to employee profiles on this page.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Activity className="h-4.5 w-4.5" />
                                        <CardTitle className="text-sm">Access Snapshot</CardTitle>
                                    </div>
                                    <CardDescription className="mt-1">
                                        Quick overview of role coverage and direct permission assignments.
                                    </CardDescription>
                                </div>

                                <Button variant="link" className="h-auto p-0 text-foreground">
                                    View Directory Insights
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border bg-muted/30 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    Users With Roles
                                </div>
                                <div className="text-xl font-semibold text-foreground">{usersWithRoles}</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Accounts with at least one assigned role.
                                </p>
                            </div>

                            <div className="rounded-xl border bg-muted/30 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    Direct Permissions
                                </div>
                                <div className="text-xl font-semibold text-foreground">{totalDirectPermissions}</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Direct permissions across visible users.
                                </p>
                            </div>

                            <div className="rounded-xl border bg-muted/30 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <Activity className="h-4 w-4" />
                                    Directory Status
                                </div>
                                <div className="text-xl font-semibold text-foreground">Active</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    User directory loaded and ready for review.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}
