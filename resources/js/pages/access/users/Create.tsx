import GeneratedCredentialsAlert from '@/components/access/users/GeneratedCredentialsAlert';
import PasswordGeneratorField from '@/components/access/users/PasswordGeneratorField';
import InputError from '@/components/input-error';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Option } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCheck, Download, Eraser, KeyRound, Mail, Shield, UserPlus, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';

interface PermissionGroup {
    group: string;
    permissions: Array<{ id: number; name: string }>;
}

interface Props {
    roleOptions: Option[];
    permissionGroups: PermissionGroup[];
    locationOptions: Option[];
}

interface CreateUserFormData {
    [key: string]: FormDataConvertible;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    send_credentials_email: boolean;
    force_password_change: boolean;
    role_ids: number[];
    permission_ids: number[];
    access_all_locations: boolean;
    location_ids: number[];
}

function formatPermissionName(value: string) {
    return value.replaceAll('.', ' / ').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function UserCreate({ roleOptions, permissionGroups, locationOptions }: Props) {
    const { flash } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Users', href: route('access.users.index') },
        { title: 'Create', href: route('access.users.create') },
    ];

    const { data, setData, post, processing, errors } = useForm<CreateUserFormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        send_credentials_email: true,
        force_password_change: true,
        role_ids: [],
        permission_ids: [],
        access_all_locations: false,
        location_ids: [],
    });

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
        post(route('access.users.store'));
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
            title="Create User"
            description="Provision a new user account, assign access, and send onboarding credentials."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('access.users.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('access.users.bulk_create')}>
                            <Users className="mr-2 h-4 w-4" />
                            Add Multiple
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('access.users.import.create')}>
                            <Download className="mr-2 h-4 w-4" />
                            Import Users
                        </Link>
                    </Button>
                </div>
            }
        >
            <form onSubmit={submit} className="space-y-6">
                <GeneratedCredentialsAlert credentials={flash.generatedCredentials} />

                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            User Onboarding
                        </CardDescription>
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="create-user-name">Full name</Label>
                                <Input
                                    id="create-user-name"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    placeholder="Rutendo Moyo"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="create-user-email">Email address</Label>
                                <Input
                                    id="create-user-email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    placeholder="rutendo.moyo@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>
                        </div>

                        <Separator />

                        <PasswordGeneratorField
                            id="create-user-password"
                            label="Initial password"
                            value={data.password}
                            error={errors.password}
                            onChange={(value) => {
                                setData('password', value);
                                setData('password_confirmation', value);
                            }}
                        />

                        <div className="grid gap-2">
                            <Label htmlFor="create-user-password-confirmation">Confirm password</Label>
                            <Input
                                id="create-user-password-confirmation"
                                value={data.password_confirmation}
                                onChange={(event) => setData('password_confirmation', event.target.value)}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="flex items-start gap-3 rounded-lg border px-4 py-3">
                                <Checkbox
                                    checked={data.send_credentials_email}
                                    onCheckedChange={(checked) => setData('send_credentials_email', !!checked)}
                                />
                                <div>
                                    <div className="text-sm font-medium text-foreground">Send credentials email</div>
                                    <div className="text-xs text-muted-foreground">
                                        Deliver the password and login link to the user by email.
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 rounded-lg border px-4 py-3">
                                <Checkbox
                                    checked={data.force_password_change}
                                    onCheckedChange={(checked) => setData('force_password_change', !!checked)}
                                />
                                <div>
                                    <div className="text-sm font-medium text-foreground">Require password change</div>
                                    <div className="text-xs text-muted-foreground">
                                        Force the user to change their password on first sign-in.
                                    </div>
                                </div>
                            </label>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">Location scope</CardDescription>
                                <CardTitle>Accessible Locations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
                                    <Checkbox checked={data.access_all_locations} onCheckedChange={(checked) => setData('access_all_locations', !!checked)} />
                                    <span className="text-sm font-medium">Head office access to all locations</span>
                                </label>
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
                            <CardContent className="grid gap-3 md:grid-cols-2">
                                {roleOptions.map((role) => {
                                    const roleId = Number(role.value);

                                    return (
                                        <label key={roleId} className="flex items-start justify-between gap-3 rounded-lg border px-4 py-3">
                                            <div>
                                                <div className="text-sm font-medium text-foreground">{role.label}</div>
                                                <div className="text-xs text-muted-foreground">Database-managed role assignment</div>
                                            </div>
                                            <Checkbox
                                                checked={data.role_ids.includes(roleId)}
                                                onCheckedChange={() => toggleRole(roleId)}
                                            />
                                        </label>
                                    );
                                })}
                                <InputError message={errors.role_ids} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                            Direct Access
                                        </CardDescription>
                                        <CardTitle>Explicit Permissions</CardTitle>
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
                                {permissionGroups.map((group) => (
                                    <div key={group.group} className="overflow-hidden rounded-lg border">
                                        <div className="border-b bg-muted/20 px-4 py-3 text-sm font-medium text-foreground">{group.group}</div>
                                        <div className="grid md:grid-cols-2">
                                            {group.permissions.map((permission, index) => (
                                                <label
                                                    key={permission.id}
                                                    className={`flex items-start justify-between gap-3 px-4 py-3 ${
                                                        index > 0 ? 'border-t md:border-t-0' : ''
                                                    } ${index % 2 === 1 ? 'md:border-l' : ''}`}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {formatPermissionName(permission.name)}
                                                        </div>
                                                        <div className="truncate text-xs text-muted-foreground">{permission.name}</div>
                                                    </div>
                                                    <Checkbox
                                                        checked={data.permission_ids.includes(permission.id)}
                                                        onCheckedChange={() => togglePermission(permission.id)}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <InputError message={errors.permission_ids} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Provisioning Summary
                                </CardDescription>
                                <CardTitle>What Will Happen</CardTitle>
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
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        Direct permissions
                                    </div>
                                    <span className="font-medium text-foreground">{data.permission_ids.length}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        Credentials email
                                    </div>
                                    <Badge variant={data.send_credentials_email ? 'secondary' : 'outline'}>
                                        {data.send_credentials_email ? 'Will send' : 'No email'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                                        Password change
                                    </div>
                                    <Badge variant={data.force_password_change ? 'secondary' : 'outline'}>
                                        {data.force_password_change ? 'Required' : 'Not required'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Permission Preview
                                </CardDescription>
                                <CardTitle>Selected Direct Access</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {selectedPermissions.length > 0 ? (
                                    selectedPermissions.slice(0, 6).map((permission) => (
                                        <div key={permission.id} className="rounded-lg border px-3 py-2 text-sm text-foreground">
                                            {formatPermissionName(permission.name)}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No direct permissions selected.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button asChild type="button" variant="outline">
                        <Link href={route('access.users.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {processing ? 'Creating...' : 'Create User'}
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}
