import InputError from '@/components/input-error';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { AccessUserRecord, Option } from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Briefcase,
    Building2,
    CheckCheck,
    Eraser,
    ExternalLink,
    KeyRound,
    Lock,
    Mail,
    Shield,
    User2,
    UserCog,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';

interface PermissionGroup {
    group: string;
    permissions: Array<{ id: number; name: string }>;
}

interface Props {
    userRecord: AccessUserRecord;
    roleOptions: Option[];
    permissionGroups: PermissionGroup[];
    selectedRoleIds: number[];
    selectedPermissionIds: number[];
    locationOptions: Option[];
    selectedLocationIds: number[];
    accessAllLocations: boolean;
}

interface UserEditFormData {
    [key: string]: string | number[] | boolean;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role_ids: number[];
    permission_ids: number[];
    access_all_locations: boolean;
    location_ids: number[];
}

function formatPermissionName(value: string) {
    return value
        .replaceAll('.', ' / ')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(name: string) {
    return (
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'U'
    );
}

function getGroupIcon(group: string) {
    const normalized = group.toLowerCase();

    if (normalized.includes('role') || normalized.includes('access') || normalized.includes('permission')) {
        return Shield;
    }

    if (normalized.includes('employee') || normalized.includes('user')) {
        return Users;
    }

    return KeyRound;
}

export default function UserEdit({ userRecord, roleOptions, permissionGroups, selectedRoleIds, selectedPermissionIds, locationOptions, selectedLocationIds, accessAllLocations }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Users', href: route('access.users.index') },
        { title: userRecord.name, href: route('access.users.show', { user: userRecord.id }) },
        { title: 'Edit', href: route('access.users.edit', { user: userRecord.id }) },
    ];

    const linkedEmployee = userRecord.employee_profile;
    const isVerified = !!userRecord.email_verified_at;

    const { data, setData, put, processing, errors } = useForm<UserEditFormData>({
        name: userRecord.name,
        email: userRecord.email,
        password: '',
        password_confirmation: '',
        role_ids: selectedRoleIds,
        permission_ids: selectedPermissionIds,
        access_all_locations: accessAllLocations,
        location_ids: selectedLocationIds,
    });

    const selectedRoles = useMemo(
        () => roleOptions.filter((role) => data.role_ids.includes(Number(role.value))),
        [data.role_ids, roleOptions],
    );

    const selectedPermissions = useMemo(
        () =>
            permissionGroups.flatMap((group) =>
                group.permissions.filter((permission) => data.permission_ids.includes(permission.id)),
            ),
        [data.permission_ids, permissionGroups],
    );

    const allPermissionIds = useMemo(
        () => permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.id)),
        [permissionGroups],
    );

    const allPermissionsSelected =
        allPermissionIds.length > 0 && allPermissionIds.every((permissionId) => data.permission_ids.includes(permissionId));

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('access.users.update', { user: userRecord.id }));
    };

    const toggleRole = (roleId: number) => {
        setData(
            'role_ids',
            data.role_ids.includes(roleId)
                ? data.role_ids.filter((id) => id !== roleId)
                : [...data.role_ids, roleId],
        );
    };

    const togglePermission = (permissionId: number) => {
        setData(
            'permission_ids',
            data.permission_ids.includes(permissionId)
                ? data.permission_ids.filter((id) => id !== permissionId)
                : [...data.permission_ids, permissionId],
        );
    };

    const assignAllPermissions = () => {
        setData('permission_ids', allPermissionIds);
    };

    const clearAllPermissions = () => {
        setData('permission_ids', []);
    };

    return (
        <PerformancePage
            title="Edit User"
            description="Update account details, role membership, and direct permissions."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('access.users.show', { user: userRecord.id })}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to User
                        </Link>
                    </Button>
                    {linkedEmployee ? (
                        <Button asChild variant="secondary">
                            <Link href={route('performance.employees.show', linkedEmployee.id)}>
                                Open Employee Profile
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    ) : null}
                </div>
            }
        >
            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader className="gap-4">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted text-lg font-semibold text-foreground">
                                    {getInitials(data.name)}
                                </div>

                                <div className="min-w-0 space-y-1">
                                    <CardTitle className="truncate text-3xl font-semibold">{data.name || 'User record'}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="truncate">{data.email || 'No email provided'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {isVerified ? (
                                    <Badge variant="secondary">
                                        <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                                        Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Pending Verification</Badge>
                                )}

                                {linkedEmployee ? (
                                    <Badge variant="outline">Employee Linked</Badge>
                                ) : (
                                    <Badge variant="outline">No Employee Link</Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Account Identity
                                </CardDescription>
                                <CardTitle>Basic Details</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="user-name">Full name</Label>
                                        <Input
                                            id="user-name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            autoComplete="name"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="user-email">Email address</Label>
                                        <Input
                                            id="user-email"
                                            type="email"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            autoComplete="email"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="user-password">New password</Label>
                                        <Input
                                            id="user-password"
                                            type="password"
                                            value={data.password}
                                            onChange={(event) => setData('password', event.target.value)}
                                            placeholder="Leave blank to keep current password"
                                            autoComplete="new-password"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="user-password-confirmation">Confirm password</Label>
                                        <Input
                                            id="user-password-confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(event) => setData('password_confirmation', event.target.value)}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">Location scope</CardDescription>
                                <CardTitle>Accessible Locations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <label className="flex items-center gap-3 rounded-lg border px-4 py-3"><Checkbox checked={data.access_all_locations} onCheckedChange={(checked) => setData('access_all_locations', !!checked)} /><span className="text-sm font-medium">Head office access to all locations</span></label>
                                {!data.access_all_locations ? locationOptions.map((location) => {
                                    const id = Number(location.value);
                                    return <label key={id} className="flex items-center gap-3 rounded-lg border px-4 py-3"><Checkbox checked={data.location_ids.includes(id)} onCheckedChange={() => setData('location_ids', data.location_ids.includes(id) ? data.location_ids.filter((value) => value !== id) : [...data.location_ids, id])} /><span className="text-sm">{location.label}</span></label>;
                                }) : null}
                                <InputError message={errors.location_ids} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Role Membership
                                </CardDescription>
                                <CardTitle>Assigned Roles</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-2">
                                    {roleOptions.map((role) => {
                                        const roleId = Number(role.value);
                                        const checked = data.role_ids.includes(roleId);
                                        const inputId = `role-${roleId}`;

                                        return (
                                            <label
                                                key={roleId}
                                                htmlFor={inputId}
                                                className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/20"
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-foreground">{role.label}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Database-managed role assignment
                                                    </div>
                                                </div>

                                                <Checkbox
                                                    id={inputId}
                                                    checked={checked}
                                                    onCheckedChange={() => toggleRole(roleId)}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>

                                <InputError message={errors.role_ids} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                            Explicit Access
                                        </CardDescription>
                                        <CardTitle>Direct Permissions</CardTitle>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={assignAllPermissions}
                                            disabled={allPermissionIds.length === 0 || allPermissionsSelected}
                                        >
                                            <CheckCheck className="mr-2 h-4 w-4" />
                                            Assign All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={clearAllPermissions}
                                            disabled={data.permission_ids.length === 0}
                                        >
                                            <Eraser className="mr-2 h-4 w-4" />
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {permissionGroups.map((group) => {
                                    const Icon = getGroupIcon(group.group);
                                    const selectedCount = group.permissions.filter((permission) =>
                                        data.permission_ids.includes(permission.id),
                                    ).length;

                                    return (
                                        <div key={group.group} className="overflow-hidden rounded-lg border">
                                            <div className="flex items-center justify-between gap-4 border-b bg-muted/20 px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-md border bg-background p-2 text-foreground">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{group.group}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {group.permissions.length} available permission
                                                            {group.permissions.length === 1 ? '' : 's'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Badge variant="outline">{selectedCount} selected</Badge>
                                            </div>

                                            <div className="grid md:grid-cols-2">
                                                {group.permissions.map((permission, index) => {
                                                    const checked = data.permission_ids.includes(permission.id);
                                                    const inputId = `permission-${permission.id}`;

                                                    return (
                                                        <label
                                                            key={permission.id}
                                                            htmlFor={inputId}
                                                            className={`flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/20 ${
                                                                index > 0 ? 'border-t md:border-t-0' : ''
                                                            } ${index % 2 === 1 ? 'md:border-l' : ''}`}
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-medium text-foreground">
                                                                    {formatPermissionName(permission.name)}
                                                                </div>
                                                                <div className="truncate text-xs text-muted-foreground">
                                                                    {permission.name}
                                                                </div>
                                                            </div>

                                                            <Checkbox
                                                                id={inputId}
                                                                checked={checked}
                                                                onCheckedChange={() => togglePermission(permission.id)}
                                                            />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                <InputError message={errors.permission_ids} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Access Snapshot
                                </CardDescription>
                                <CardTitle>Current Summary</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        Roles selected
                                    </div>
                                    <span className="font-medium text-foreground">{data.role_ids.length}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                                        Direct permissions
                                    </div>
                                    <span className="font-medium text-foreground">{data.permission_ids.length}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        Permission groups
                                    </div>
                                    <span className="font-medium text-foreground">{permissionGroups.length}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Account status
                                    </div>
                                    <span className="font-medium text-foreground">{isVerified ? 'Verified' : 'Pending'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Employment Link
                                </CardDescription>
                                <CardTitle>Employee Profile</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {linkedEmployee ? (
                                    <>
                                        <div className="grid gap-4">
                                            <div className="rounded-lg border bg-muted/20 p-4">
                                                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                                    Employee Number
                                                </div>
                                                <div className="mt-1 text-base font-medium text-foreground">
                                                    {linkedEmployee.employee_number}
                                                </div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-lg border px-4 py-3">
                                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        Department
                                                    </div>
                                                    <div className="mt-1 text-sm font-medium text-foreground">
                                                        {linkedEmployee.department?.name ?? 'Not linked'}
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border px-4 py-3">
                                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                        <Briefcase className="h-3.5 w-3.5" />
                                                        Job Title
                                                    </div>
                                                    <div className="mt-1 text-sm font-medium text-foreground">
                                                        {linkedEmployee.job_title?.name ?? 'Not linked'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={route('performance.employees.show', linkedEmployee.id)}>
                                                Open Employee Profile
                                                <ExternalLink className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </>
                                ) : (
                                    <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                                        No employee profile is linked to this user yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Assignment Preview
                                </CardDescription>
                                <CardTitle>Selected Access</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Roles
                                    </div>
                                    {selectedRoles.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRoles.map((role) => (
                                                <Badge key={role.value} variant="secondary">
                                                    {role.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No roles selected.</p>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Direct Permissions
                                    </div>
                                    {selectedPermissions.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedPermissions.slice(0, 5).map((permission) => (
                                                <div key={permission.id} className="rounded-lg border px-3 py-2 text-sm text-foreground">
                                                    {formatPermissionName(permission.name)}
                                                </div>
                                            ))}

                                            {selectedPermissions.length > 5 ? (
                                                <div className="text-xs text-muted-foreground">
                                                    +{selectedPermissions.length - 5} more permission
                                                    {selectedPermissions.length - 5 === 1 ? '' : 's'} selected
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No direct permissions selected.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button asChild type="button" variant="outline">
                        <Link href={route('access.users.show', { user: userRecord.id })}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        <User2 className="mr-2 h-4 w-4" />
                        {processing ? 'Saving...' : 'Update User'}
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}
