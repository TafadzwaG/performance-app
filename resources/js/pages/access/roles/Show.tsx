import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PerformancePage from '@/components/performance/PerformancePage';
import type { BreadcrumbItem } from '@/types';
import type { RoleRecord } from '@/types/performance';
import { Link } from '@inertiajs/react';
import { ChevronRight, KeyRound, Shield, UserCog, Users } from 'lucide-react';

interface PermissionGroup {
    group: string;
    permissions: Array<{ id: number; name: string }>;
}

function formatPermissionName(value: string) {
    return value
        .replaceAll('.', ' / ')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'R';
}

const breadcrumbs = (role: RoleRecord): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Roles', href: route('access.roles.index') },
    { title: role.name, href: route('access.roles.show', { role: role.id }) },
];

export default function RoleShow({ role, permissionGroups }: { role: RoleRecord; permissionGroups: PermissionGroup[] }) {
    const assignedPermissions = role.permissions ?? [];
    const assignedUsers = role.users ?? [];
    const coveredGroups = permissionGroups
        .map((group) => ({
            ...group,
            assignedPermissions: group.permissions.filter((permission) => assignedPermissions.some((item) => item.id === permission.id)),
        }))
        .filter((group) => group.assignedPermissions.length > 0);

    return (
        <PerformancePage
            title={role.name}
            description="Role summary with assigned permissions and users."
            breadcrumbs={breadcrumbs(role)}
            secondaryActions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('access.roles.index')}>Back to Roles</Link>
                    </Button>
                    <Button asChild>
                        <Link href={route('access.roles.edit', { role: role.id })}>Edit Role</Link>
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Access</span>
                            <ChevronRight className="h-3 w-3" />
                            <span>Roles</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="font-medium text-foreground">{role.name}</span>
                        </div>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-muted text-lg font-semibold text-foreground">
                                    {getInitials(role.name)}
                                </div>

                                <div className="min-w-0 space-y-1">
                                    <CardTitle className="truncate text-3xl font-semibold">{role.name}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        <span>Guard: {role.guard_name ?? 'web'}</span>
                                    </div>
                                </div>
                            </div>

                            <Badge variant="secondary" className="w-fit">
                                {assignedPermissions.length} permission{assignedPermissions.length === 1 ? '' : 's'}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <KeyRound className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Permissions
                                </p>
                                <p className="text-lg font-semibold">{assignedPermissions.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <Users className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Assigned Users
                                </p>
                                <p className="text-lg font-semibold">{assignedUsers.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <Shield className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Covered Groups
                                </p>
                                <p className="text-lg font-semibold">{coveredGroups.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <Card className="xl:col-span-7">
                        <CardHeader>
                            <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                Permission Coverage
                            </CardDescription>
                            <CardTitle>Assigned Permissions</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {coveredGroups.length > 0 ? (
                                coveredGroups.map((group) => (
                                    <div key={group.group} className="rounded-lg border">
                                        <div className="flex items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                                            <div>
                                                <div className="font-medium text-foreground">{group.group}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {group.assignedPermissions.length} assigned permission
                                                    {group.assignedPermissions.length === 1 ? '' : 's'}
                                                </div>
                                            </div>

                                            <Badge variant="outline">{group.assignedPermissions.length}</Badge>
                                        </div>

                                        <div className="flex flex-wrap gap-2 p-4">
                                            {group.assignedPermissions.map((permission) => (
                                                <Badge key={permission.id} variant="secondary">
                                                    {formatPermissionName(permission.name)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                                    This role does not currently have any assigned permissions.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-5">
                        <CardHeader>
                            <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                Membership
                            </CardDescription>
                            <CardTitle>Assigned Users</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {assignedUsers.length > 0 ? (
                                assignedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-sm font-medium text-foreground">
                                                {getInitials(user.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium text-foreground">{user.name}</div>
                                                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>

                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={route('access.users.show', { user: user.id })}>View</Link>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                                    No users are currently assigned to this role.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg border bg-muted p-2 text-foreground">
                                <UserCog className="h-4 w-4" />
                            </div>
                            <div>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Operational Notes
                                </CardDescription>
                                <CardTitle className="text-lg">Role Behavior</CardTitle>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Permission Model
                            </div>
                            <div className="mt-2 text-sm text-foreground">
                                This role resolves access through database-managed permissions only.
                            </div>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Runtime Scope
                            </div>
                            <div className="mt-2 text-sm text-foreground">
                                Changes to this role affect all users assigned to it after synchronization.
                            </div>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Access Guard
                            </div>
                            <div className="mt-2 text-sm text-foreground">{role.guard_name ?? 'web'}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
