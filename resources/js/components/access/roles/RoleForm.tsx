import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Option } from '@/types/performance';
import { Link } from '@inertiajs/react';
import { ArrowLeft, BarChart3, CheckCheck, Eraser, KeyRound, LayoutGrid, Save, Search, Settings2, Shield, UserCog, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

export interface PermissionGroup {
    group: string;
    permissions: Array<{ id: number; name: string }>;
}

export interface UserOption extends Option {
    email?: string;
}

export interface RoleFormData {
    [key: string]: string | number[];
    name: string;
    permission_ids: number[];
    user_ids: number[];
}

interface RoleFormProps {
    data: RoleFormData;
    setData: <K extends keyof RoleFormData>(key: K, value: RoleFormData[K]) => void;
    errors: Partial<Record<string, string>>;
    processing: boolean;
    permissionGroups: PermissionGroup[];
    userOptions: UserOption[];
    cancelHref: string;
    submitLabel: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function formatPermissionName(value: string) {
    return value
        .replaceAll('.', ' / ')
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getGroupIcon(group: string) {
    const normalized = group.toLowerCase();

    if (normalized.includes('report')) {
        return BarChart3;
    }

    if (normalized.includes('access') || normalized.includes('role') || normalized.includes('permission')) {
        return Shield;
    }

    if (normalized.includes('setup') || normalized.includes('config')) {
        return Settings2;
    }

    if (normalized.includes('employee') || normalized.includes('user')) {
        return UserCog;
    }

    return LayoutGrid;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'R';
}

export default function RoleForm({
    data,
    setData,
    errors,
    processing,
    permissionGroups,
    userOptions,
    cancelHref,
    submitLabel,
    onSubmit,
}: RoleFormProps) {
    const [userSearch, setUserSearch] = useState('');

    const filteredUsers = useMemo(() => {
        const term = userSearch.trim().toLowerCase();

        if (!term) {
            return userOptions;
        }

        return userOptions.filter((option) => {
            const label = option.label.toLowerCase();
            const email = String(option.email ?? '').toLowerCase();

            return label.includes(term) || email.includes(term);
        });
    }, [userOptions, userSearch]);

    const selectedUsers = useMemo(
        () => userOptions.filter((option) => data.user_ids.includes(Number(option.value))),
        [data.user_ids, userOptions],
    );

    const allPermissionIds = useMemo(
        () => permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.id)),
        [permissionGroups],
    );

    const allPermissionsSelected =
        allPermissionIds.length > 0 && allPermissionIds.every((permissionId) => data.permission_ids.includes(permissionId));

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

    const toggleUser = (userId: number) => {
        setData(
            'user_ids',
            data.user_ids.includes(userId)
                ? data.user_ids.filter((id) => id !== userId)
                : [...data.user_ids, userId],
        );
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                Role Identity
                            </CardDescription>
                            <CardTitle>Role Configuration</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="role-name">Role name</Label>
                                <Input
                                    id="role-name"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    placeholder="e.g. Department Reviewer"
                                    autoComplete="off"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Guard
                                    </div>
                                    <div className="mt-1 text-lg font-semibold text-foreground">Web</div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Selected Permissions
                                    </div>
                                    <div className="mt-1 text-lg font-semibold text-foreground">{data.permission_ids.length}</div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                        Assigned Users
                                    </div>
                                    <div className="mt-1 text-lg font-semibold text-foreground">{data.user_ids.length}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                        Permission Matrix
                                    </CardDescription>
                                    <CardTitle>Permission Assignment</CardTitle>
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

                                            <Badge variant="outline">
                                                {selectedCount} selected
                                            </Badge>
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
                                Assignment Summary
                            </CardDescription>
                            <CardTitle>Access Snapshot</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-background text-base font-semibold text-foreground">
                                    {getInitials(data.name)}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate font-medium text-foreground">
                                        {data.name.trim() || 'Role preview'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Changes apply immediately to all assigned users.
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                                        Permissions selected
                                    </div>
                                    <span className="font-medium text-foreground">{data.permission_ids.length}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        Users assigned
                                    </div>
                                    <span className="font-medium text-foreground">{data.user_ids.length}</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        Permission groups
                                    </div>
                                    <span className="font-medium text-foreground">{permissionGroups.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                User Assignment
                            </CardDescription>
                            <CardTitle>Assign Users</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={userSearch}
                                    onChange={(event) => setUserSearch(event.target.value)}
                                    placeholder="Search users by name or email"
                                    className="pl-9"
                                />
                            </div>

                            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((option) => {
                                        const userId = Number(option.value);
                                        const checked = data.user_ids.includes(userId);
                                        const checkboxId = `user-${userId}`;

                                        return (
                                            <label
                                                key={userId}
                                                htmlFor={checkboxId}
                                                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-muted/20"
                                            >
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium text-foreground">
                                                        {option.label}
                                                    </div>
                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {option.email ?? 'No email provided'}
                                                    </div>
                                                </div>

                                                <Checkbox
                                                    id={checkboxId}
                                                    checked={checked}
                                                    onCheckedChange={() => toggleUser(userId)}
                                                />
                                            </label>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                        No users match the current search.
                                    </div>
                                )}
                            </div>

                            <InputError message={errors.user_ids} />
                        </CardContent>
                    </Card>

                    {selectedUsers.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardDescription className="text-[11px] font-medium uppercase tracking-[0.18em]">
                                    Selected Members
                                </CardDescription>
                                <CardTitle>Assigned User Preview</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-2">
                                {selectedUsers.slice(0, 5).map((user) => (
                                    <div key={user.value} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-foreground">{user.label}</div>
                                            <div className="truncate text-xs text-muted-foreground">
                                                {user.email ?? 'No email provided'}
                                            </div>
                                        </div>
                                        <Badge variant="secondary">Assigned</Badge>
                                    </div>
                                ))}

                                {selectedUsers.length > 5 ? (
                                    <div className="text-xs text-muted-foreground">
                                        +{selectedUsers.length - 5} more user{selectedUsers.length - 5 === 1 ? '' : 's'} selected
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline">
                    <Link href={cancelHref}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancel
                    </Link>
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
