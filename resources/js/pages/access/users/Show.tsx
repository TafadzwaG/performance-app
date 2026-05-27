import GeneratedCredentialsAlert from '@/components/access/users/GeneratedCredentialsAlert';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { AccessUserRecord } from '@/types/performance';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck, Briefcase, Building2, ChevronRight, ExternalLink, KeyRound, Lock, Mail, Shield, ShieldCheck, SquarePen, User2, Users } from 'lucide-react';

interface PermissionRecord {
    id: number;
    name: string;
}

const breadcrumbs = (userRecord: AccessUserRecord): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Users', href: route('access.users.index') },
    { title: userRecord.name, href: route('access.users.show', { user: userRecord.id }) },
];

function formatPermissionName(value: string) {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export default function UserShow({
    userRecord,
    effectivePermissions,
}: {
    userRecord: AccessUserRecord;
    effectivePermissions: PermissionRecord[];
}) {
    const { flash } = usePage<SharedData>().props;
    const linkedEmployee = userRecord.employee_profile;
    const roles = userRecord.roles ?? [];
    const directPermissions = userRecord.permissions ?? [];
    const isVerified = !!userRecord.email_verified_at;

    return (
        <PerformancePage
            title={userRecord.name}
            description="User account details, assigned roles, and resolved permissions."
            breadcrumbs={breadcrumbs(userRecord)}
            secondaryActions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('access.users.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href={route('access.users.edit', { user: userRecord.id })}>
                            <SquarePen className="mr-2 h-4 w-4" />
                            Manage Access
                        </Link>
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <GeneratedCredentialsAlert credentials={flash.generatedCredentials} />

                <Card>
                    <CardHeader className="gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Users</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{userRecord.name}</span>
                        </div>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted text-lg font-semibold text-foreground">
                                    {getInitials(userRecord.name)}
                                </div>

                                <div className="min-w-0 space-y-1">
                                    <CardTitle className="truncate text-3xl font-semibold">{userRecord.name}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="truncate">{userRecord.email}</span>
                                    </div>
                                </div>
                            </div>

                            {isVerified ? (
                                <Badge variant="secondary" className="w-fit">
                                    <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                                    Verified
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="w-fit">
                                    Email Not Verified
                                </Badge>
                            )}

                            {userRecord.force_password_change ? (
                                <Badge variant="outline" className="w-fit">
                                    <Lock className="mr-1 h-3.5 w-3.5" />
                                    Password Change Required
                                </Badge>
                            ) : null}

                            <Badge variant={userRecord.email_mfa_enabled ? 'secondary' : 'outline'} className="w-fit">
                                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                MFA {userRecord.email_mfa_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 xl:grid-cols-12">
                    <Card className="xl:col-span-5">
                        <CardHeader>
                            <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                Account Overview
                            </CardDescription>
                            <CardTitle>Identity & Access</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Roles
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold">{roles.length}</div>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Effective Permissions
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold">{effectivePermissions.length}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Direct Permissions
                                </div>
                                {directPermissions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {directPermissions.map((permission) => (
                                            <Badge key={permission.id} variant="outline">
                                                {permission.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No direct permissions assigned.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-7">
                        <CardHeader>
                            <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                Employment Identity
                            </CardDescription>
                            <CardTitle>Employee Link</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-1">
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Employee Number
                                    </div>
                                    <div className="text-base font-medium">
                                        {linkedEmployee?.employee_number ?? 'Not linked'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Department
                                    </div>
                                    <div className="text-base font-medium">
                                        {linkedEmployee?.department?.name ?? 'Not linked'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Job Title
                                    </div>
                                    <div className="text-base font-medium">
                                        {linkedEmployee?.job_title?.name ?? 'Not linked'}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-end">
                                {linkedEmployee ? (
                                    <Button asChild variant="outline">
                                        <Link href={route('performance.employees.show', linkedEmployee.id)}>
                                            Open Employee Profile
                                            <ExternalLink className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button variant="outline" disabled>
                                        Employee Profile Not Linked
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg border bg-muted p-2 text-foreground">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                        Assigned Roles
                                    </CardDescription>
                                    <CardTitle className="text-lg">Role Membership</CardTitle>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {roles.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {roles.map((role) => (
                                        <Badge key={role.id} variant="secondary">
                                            {role.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No roles assigned.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg border bg-muted p-2 text-foreground">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                        Direct Permissions
                                    </CardDescription>
                                    <CardTitle className="text-lg">Explicit Access</CardTitle>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {directPermissions.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {directPermissions.map((permission) => (
                                        <Badge key={permission.id} variant="outline">
                                            {permission.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No direct permissions assigned.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Security Manifest
                        </CardDescription>
                        <CardTitle>Effective Permissions</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {effectivePermissions.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {effectivePermissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background">
                                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm font-medium">
                                            {formatPermissionName(permission.name)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No effective permissions resolved.</p>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <User2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Account Status
                                </p>
                                <p className="text-lg font-semibold">{isVerified ? 'Verified' : 'Pending Verification'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Department
                                </p>
                                <p className="text-lg font-semibold">{linkedEmployee?.department?.name ?? 'Unassigned'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-lg border bg-muted p-3 text-foreground">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Job Title
                                </p>
                                <p className="text-lg font-semibold">{linkedEmployee?.job_title?.name ?? 'Not linked'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PerformancePage>
    );
}
