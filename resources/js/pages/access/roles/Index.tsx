import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, RoleRecord } from '@/types/performance';
import { Link } from '@inertiajs/react';
import { Eye, KeyRound, Pencil, Plus, Shield, UserCog, Users } from 'lucide-react';

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Roles', href: route('access.roles.index') },
];

export default function RolesIndex({ roles }: { roles: Paginated<RoleRecord> }) {
    const rolesOnPage = roles.data.length;
    const totalRoles = roles.total ?? rolesOnPage;
    const rolesWithUsers = roles.data.filter((role) => (role.users?.length ?? 0) > 0).length;
    const totalAssignedUsers = roles.data.reduce((sum, role) => sum + (role.users?.length ?? 0), 0);
    const totalPermissionLinks = roles.data.reduce((sum, role) => sum + (role.permissions?.length ?? 0), 0);

    return (
        <PerformancePage
            title="Roles"
            description="Manage role definitions, permission bundles, and assigned users."
            breadcrumbs={breadcrumbs}
            primaryAction={{
                label: 'New Role',
                href: route('access.roles.create'),
                icon: <Plus className="h-4 w-4" />,
            }}
        >
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <Shield className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Total Roles
                                </p>
                                <p className="text-lg font-semibold">{totalRoles}</p>
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
                                    Roles With Users
                                </p>
                                <p className="text-lg font-semibold">{rolesWithUsers}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <UserCog className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    User Assignments
                                </p>
                                <p className="text-lg font-semibold">{totalAssignedUsers}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <KeyRound className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Permission Links
                                </p>
                                <p className="text-lg font-semibold">{totalPermissionLinks}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Access Directory
                        </CardDescription>
                        <CardTitle>Role Catalogue</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b bg-muted/30">
                                    <tr>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                            Role
                                        </th>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                            Permissions
                                        </th>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                            Assigned Users
                                        </th>
                                        <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                            Guard
                                        </th>
                                        <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {roles.data.length > 0 ? (
                                        roles.data.map((role) => (
                                            <tr key={role.id} className="border-t transition-colors hover:bg-muted/20">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted text-sm font-medium text-foreground">
                                                            {getInitials(role.name)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium text-foreground">{role.name}</div>
                                                            <div className="text-xs text-muted-foreground">Role ID #{role.id}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    {role.permissions && role.permissions.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {role.permissions.slice(0, 3).map((permission) => (
                                                                <Badge key={permission.id} variant="secondary">
                                                                    {formatPermissionName(permission.name)}
                                                                </Badge>
                                                            ))}
                                                            {role.permissions.length > 3 ? (
                                                                <Badge variant="outline">+{role.permissions.length - 3} more</Badge>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">No permissions assigned</span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {role.users && role.users.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {role.users.slice(0, 2).map((user) => (
                                                                <Badge key={user.id} variant="outline">
                                                                    {user.name}
                                                                </Badge>
                                                            ))}
                                                            {role.users.length > 2 ? (
                                                                <Badge variant="outline">+{role.users.length - 2} more</Badge>
                                                            ) : null}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">No users assigned</span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-sm text-foreground">{role.guard_name ?? 'web'}</td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={route('access.roles.show', { role: role.id })}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={route('access.roles.edit', { role: role.id })}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-14 text-center">
                                                <div className="mx-auto max-w-md space-y-2">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                                                        <Shield className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-base font-semibold text-foreground">No roles found</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Create a role to start assigning permissions and users.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {roles.links.length > 0 ? (
                            <div className="border-t px-5 py-4">
                                <PaginationLinks paginated={roles} />
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                Current Page Summary
                            </CardDescription>
                            <CardTitle>Role Coverage</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <span className="text-sm text-foreground">Roles on this page</span>
                                <span className="font-medium text-foreground">{rolesOnPage}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <span className="text-sm text-foreground">Roles with assigned users</span>
                                <span className="font-medium text-foreground">{rolesWithUsers}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <span className="text-sm text-foreground">Roles without users</span>
                                <span className="font-medium text-foreground">{rolesOnPage - rolesWithUsers}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                Operational Note
                            </CardDescription>
                            <CardTitle>Permission-Driven Access</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                Roles in this module are database-managed and resolve access through assigned permissions rather than hardcoded role checks.
                            </p>
                            <p>
                                Use role details to review permission bundles and user membership before making changes.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}
