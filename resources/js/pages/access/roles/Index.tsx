import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, RoleRecord } from '@/types/performance';
import { Link } from '@inertiajs/react';
import {
    Activity,
    ClipboardCheck,
    Database,
    Fingerprint,
    Key,
    Lock,
    Plus,
    Settings2,
    ShieldAlert,
    ShieldCheck,
    User,
    UserCog,
    Users,
} from 'lucide-react';

const RoleIcon = ({ name, id, className }: { name: string; id: number; className?: string }) => {
    const normalized = name.toLowerCase();

    if (normalized.includes('super admin')) return <ShieldAlert className={className} />;
    if (normalized.includes('hr admin')) return <UserCog className={className} />;
    if (normalized.includes('approving manager')) return <ClipboardCheck className={className} />;
    if (normalized.includes('manager')) return <Users className={className} />;
    if (normalized.includes('employee')) return <User className={className} />;

    const library = [Fingerprint, Key, ShieldCheck];
    const Icon = library[id % library.length];

    return <Icon className={className} />;
};

const formatPermission = (name: string) => {
    const parts = name.split('.');
    const label = parts.length > 1 ? parts.slice(1).join(' ') : name;
    return label.replace(/_/g, ' ');
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Roles', href: route('access.roles.index') },
];

export default function RolesIndex({ roles }: { roles: Paginated<RoleRecord> }) {
    const totalRoles = roles?.total ?? roles?.data?.length ?? 0;
    const from = roles?.from ?? 0;
    const to = roles?.to ?? roles?.data?.length ?? 0;

    return (
        <PerformancePage
            title="Roles & Access"
            description="Manage organizational roles and granular permission sets."
            breadcrumbs={breadcrumbs}
            primaryAction={{
                label: 'New Role',
                href: route('access.roles.create'),
                icon: <Plus className="h-4 w-4" />,
            }}
        >
            <div className="w-full max-w-none space-y-6">
                {/* Header */}
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Role Directory
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Roles & Access</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Manage organizational roles, permission assignments, and user access coverage.
                                </p>
                            </div>
                        </div>

                        <Button asChild>
                            <Link href={route('access.roles.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                New Role
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <Card className="w-full shadow-sm">
                    <CardContent className="p-0">
                        <div className="w-full overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                            Role Identity
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                            Permissions
                                        </th>
                                        <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                            Users
                                        </th>
                                        <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {roles.data.length > 0 ? (
                                        roles.data.map((role) => (
                                            <tr
                                                key={role.id}
                                                className="border-t transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-muted/40 text-foreground">
                                                            <RoleIcon
                                                                name={role.name}
                                                                id={role.id}
                                                                className="h-5 w-5 stroke-[2px]"
                                                            />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="truncate font-semibold text-foreground">
                                                                {role.name}
                                                            </div>
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                ID: ROLE-{role.id} • {role.guard_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-2">
                                                        {role.permissions && role.permissions.length > 0 ? (
                                                            <>
                                                                {role.permissions.slice(0, 3).map((perm) => (
                                                                    <Badge key={perm.id} variant="secondary">
                                                                        {formatPermission(perm.name)}
                                                                    </Badge>
                                                                ))}

                                                                {role.permissions.length > 3 && (
                                                                    <span className="rounded-md border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                                                                        +{role.permissions.length - 3} more
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                No active permissions
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex items-center">
                                                        {role.users && role.users.length > 0 ? (
                                                            <div className="flex -space-x-2">
                                                                {role.users.slice(0, 3).map((user) => (
                                                                    <div
                                                                        key={user.id}
                                                                        title={user.email}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold uppercase text-foreground shadow-sm"
                                                                    >
                                                                        {user.name.charAt(0)}
                                                                    </div>
                                                                ))}

                                                                {role.users.length > 3 && (
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground shadow-sm">
                                                                        +{role.users.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">No users</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild variant="ghost" size="icon">
                                                            <Link href={route('access.roles.edit', role.id)}>
                                                                <Settings2 className="h-4 w-4" />
                                                            </Link>
                                                        </Button>

                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={route('access.roles.show', role.id)}>
                                                                Manage Access
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-14 text-center">
                                                <div className="mx-auto max-w-md space-y-2">
                                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
                                                        <ShieldCheck className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-base font-semibold text-foreground">
                                                        No roles found
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        There are no roles available to display right now.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-4 border-t bg-background px-6 py-4 md:flex-row md:items-center md:justify-between">
                            <div className="text-xs text-muted-foreground">
                                Showing <span className="font-semibold text-foreground">{from}</span> to{' '}
                                <span className="font-semibold text-foreground">{to}</span> of{' '}
                                <span className="font-semibold text-foreground">{totalRoles}</span> system roles
                            </div>

                            <PaginationLinks paginated={roles} />
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom insight cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-foreground">
                                <Database className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm">Total Roles</CardTitle>
                            </div>
                            <CardDescription>
                                Defined role entries in the current system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{totalRoles}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Defined in system architecture.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-foreground">
                                <Lock className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm">Auth Guard</CardTitle>
                            </div>
                            <CardDescription>
                                Active authentication provider context.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">Web</div>
                            <p className="mt-1 text-xs text-muted-foreground">Active provider session verified.</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-foreground">
                                <Activity className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm">Sync Status</CardTitle>
                            </div>
                            <CardDescription>
                                System role synchronization status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">Live</div>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div className="h-full w-full rounded-full bg-foreground/70" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}