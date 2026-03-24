import BulkUserRowsEditor, { type BulkUserRow } from '@/components/access/users/BulkUserRowsEditor';
import GeneratedCredentialsAlert from '@/components/access/users/GeneratedCredentialsAlert';
import InputError from '@/components/input-error';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Option } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCheck, Download, Eraser, Mail, Shield, UserPlus, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo } from 'react';

interface PermissionGroup {
    group: string;
    permissions: Array<{ id: number; name: string }>;
}

interface Props {
    roleOptions: Option[];
    permissionGroups: PermissionGroup[];
}

interface BulkCreateFormData {
    [key: string]: FormDataConvertible;
    users: BulkUserRow[];
    default_role_ids: number[];
    default_permission_ids: number[];
}

const createRow = (): BulkUserRow => ({
    name: '',
    email: '',
    password: '',
    force_password_change: true,
    send_credentials_email: true,
});

function formatPermissionName(value: string) {
    return value.replaceAll('.', ' / ').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function BulkCreate({ roleOptions, permissionGroups }: Props) {
    const { flash } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Users', href: route('access.users.index') },
        { title: 'Add Multiple', href: route('access.users.bulk_create') },
    ];

    const { data, setData, post, processing, errors } = useForm<BulkCreateFormData>({
        users: [createRow()],
        default_role_ids: [],
        default_permission_ids: [],
    });

    const allPermissionIds = useMemo(
        () => permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.id)),
        [permissionGroups],
    );

    const allPermissionsSelected =
        allPermissionIds.length > 0 &&
        allPermissionIds.every((permissionId) => data.default_permission_ids.includes(permissionId));

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('access.users.bulk_store'));
    };

    const updateRow = <K extends keyof BulkUserRow>(index: number, key: K, value: BulkUserRow[K]) => {
        setData(
            'users',
            data.users.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
        );
    };

    const addRow = () => setData('users', [...data.users, createRow()]);

    const removeRow = (index: number) => {
        setData(
            'users',
            data.users.filter((_, rowIndex) => rowIndex !== index),
        );
    };

    const toggleDefaultRole = (roleId: number) => {
        setData(
            'default_role_ids',
            data.default_role_ids.includes(roleId)
                ? data.default_role_ids.filter((id) => id !== roleId)
                : [...data.default_role_ids, roleId],
        );
    };

    const toggleDefaultPermission = (permissionId: number) => {
        setData(
            'default_permission_ids',
            data.default_permission_ids.includes(permissionId)
                ? data.default_permission_ids.filter((id) => id !== permissionId)
                : [...data.default_permission_ids, permissionId],
        );
    };

    const assignAllPermissions = () => {
        setData('default_permission_ids', allPermissionIds);
    };

    const clearAllPermissions = () => {
        setData('default_permission_ids', []);
    };

    return (
        <PerformancePage
            title="Add Multiple Users"
            description="Create several user accounts at once and apply shared access assignments."
            breadcrumbs={breadcrumbs}
            secondaryActions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('access.users.create')}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Single User
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Shared Access
                                </CardDescription>
                                <CardTitle>Roles & Permissions Applied To Every Row</CardTitle>
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
                                    disabled={data.default_permission_ids.length === 0}
                                >
                                    <Eraser className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-3 md:grid-cols-2">
                            {roleOptions.map((role) => {
                                const roleId = Number(role.value);

                                return (
                                    <label key={roleId} className="flex items-start justify-between gap-3 rounded-lg border px-4 py-3">
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{role.label}</div>
                                            <div className="text-xs text-muted-foreground">Assigned to every created user</div>
                                        </div>
                                        <Checkbox
                                            checked={data.default_role_ids.includes(roleId)}
                                            onCheckedChange={() => toggleDefaultRole(roleId)}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        <InputError message={errors.default_role_ids} />

                        <div className="space-y-4">
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
                                                <div className="text-sm text-foreground">{formatPermissionName(permission.name)}</div>
                                                <Checkbox
                                                    checked={data.default_permission_ids.includes(permission.id)}
                                                    onCheckedChange={() => toggleDefaultPermission(permission.id)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <InputError message={errors.default_permission_ids} />
                    </CardContent>
                </Card>

                <BulkUserRowsEditor
                    rows={data.users}
                    errors={errors}
                    updateRow={updateRow}
                    addRow={addRow}
                    removeRow={removeRow}
                />

                <Card>
                    <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                <Users className="h-4 w-4" />
                                Rows
                            </div>
                            <div className="text-2xl font-semibold text-foreground">{data.users.length}</div>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                Shared Roles
                            </div>
                            <div className="text-2xl font-semibold text-foreground">{data.default_role_ids.length}</div>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                Email Delivery
                            </div>
                            <Badge variant="outline">{data.users.filter((row) => row.send_credentials_email).length} rows sending</Badge>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button asChild type="button" variant="outline">
                        <Link href={route('access.users.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancel
                        </Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {processing ? 'Creating...' : 'Create Users'}
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}
