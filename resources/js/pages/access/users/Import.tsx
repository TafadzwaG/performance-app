import GeneratedCredentialsAlert from '@/components/access/users/GeneratedCredentialsAlert';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Option } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCheck, Download, Eraser, FileSpreadsheet, Shield, UserPlus, Users } from 'lucide-react';
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

interface ImportUsersFormData {
    [key: string]: FormDataConvertible;
    file: File | null;
    default_role_ids: number[];
    default_permission_ids: number[];
    default_force_password_change: boolean;
    default_send_credentials_email: boolean;
}

function formatPermissionName(value: string) {
    return value.replaceAll('.', ' / ').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function UserImport({ roleOptions, permissionGroups }: Props) {
    const { flash } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Users', href: route('access.users.index') },
        { title: 'Import', href: route('access.users.import.create') },
    ];

    const { data, setData, post, processing, errors } = useForm<ImportUsersFormData>({
        file: null,
        default_role_ids: [],
        default_permission_ids: [],
        default_force_password_change: true,
        default_send_credentials_email: true,
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
        post(route('access.users.import.store'));
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
            title="Import Users"
            description="Upload an Excel, CSV, or ODS file to create many users at once."
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
                        <Link href={route('access.users.bulk_create')}>
                            <Users className="mr-2 h-4 w-4" />
                            Add Multiple
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <a href={route('access.users.import.template')}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Template
                        </a>
                    </Button>
                </div>
            }
        >
            <form onSubmit={submit} className="space-y-6">
                <GeneratedCredentialsAlert credentials={flash.generatedCredentials} />

                <Card>
                    <CardHeader>
                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                            Import File
                        </CardDescription>
                        <CardTitle>Spreadsheet Upload</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="rounded-lg border border-dashed px-5 py-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-lg border bg-muted p-3 text-foreground">
                                    <FileSpreadsheet className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-foreground">Accepted formats</div>
                                    <div className="text-xs text-muted-foreground">CSV, XLSX, and ODS</div>
                                </div>
                            </div>

                            <Input
                                type="file"
                                accept=".csv,.xlsx,.ods"
                                onChange={(event) => setData('file', event.target.files?.[0] ?? null)}
                            />
                            {errors.file ? <p className="mt-2 text-sm text-destructive">{errors.file}</p> : null}
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                            Template columns:
                            <span className="ml-1 font-medium text-foreground">
                                name, email, password, force_password_change, send_credentials_email, role_names, permission_names
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                            Default Access
                                        </CardDescription>
                                        <CardTitle>Fallback Roles & Permissions</CardTitle>
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
                                                    <div className="text-xs text-muted-foreground">Used when a row leaves role_names blank</div>
                                                </div>
                                                <Checkbox
                                                    checked={data.default_role_ids.includes(roleId)}
                                                    onCheckedChange={() => toggleDefaultRole(roleId)}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>

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
                                                        <div className="text-sm text-foreground">
                                                            {formatPermissionName(permission.name)}
                                                        </div>
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
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Import Defaults
                                </CardDescription>
                                <CardTitle>Onboarding Rules</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <label className="flex items-start gap-3 rounded-lg border px-4 py-3">
                                    <Checkbox
                                        checked={data.default_send_credentials_email}
                                        onCheckedChange={(checked) => setData('default_send_credentials_email', !!checked)}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-foreground">Send credentials email</div>
                                        <div className="text-xs text-muted-foreground">
                                            Used when a row leaves send_credentials_email blank.
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 rounded-lg border px-4 py-3">
                                    <Checkbox
                                        checked={data.default_force_password_change}
                                        onCheckedChange={(checked) => setData('default_force_password_change', !!checked)}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-foreground">Require password change</div>
                                        <div className="text-xs text-muted-foreground">
                                            Used when a row leaves force_password_change blank.
                                        </div>
                                    </div>
                                </label>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Resolution Rules
                                </CardDescription>
                                <CardTitle>How Imports Behave</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="rounded-lg border px-4 py-3">
                                    Row-level `role_names` and `permission_names` override the defaults.
                                </div>
                                <div className="rounded-lg border px-4 py-3">
                                    Blank passwords are generated automatically during import.
                                </div>
                                <div className="rounded-lg border px-4 py-3">
                                    Unknown role or permission names stop the import and show the row errors.
                                </div>
                                <div className="rounded-lg border px-4 py-3">
                                    Generated passwords are shown once after import for rows where email delivery is disabled.
                                </div>
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
                        <Shield className="mr-2 h-4 w-4" />
                        {processing ? 'Importing...' : 'Import Users'}
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}
