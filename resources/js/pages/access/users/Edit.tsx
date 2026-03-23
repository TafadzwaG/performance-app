import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { AccessUserRecord, Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

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
}

export default function UserEdit({ userRecord, roleOptions, permissionGroups, selectedRoleIds, selectedPermissionIds }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Users', href: route('access.users.index') },
        { title: userRecord.name, href: route('access.users.show', { user: userRecord.id }) },
        { title: 'Edit', href: route('access.users.edit', { user: userRecord.id }) },
    ];

    const { data, setData, put, processing } = useForm<{
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        role_ids: number[];
        permission_ids: number[];
    }>({
        name: userRecord.name,
        email: userRecord.email,
        password: '',
        password_confirmation: '',
        role_ids: selectedRoleIds,
        permission_ids: selectedPermissionIds,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('access.users.update', { user: userRecord.id }));
    };

    return (
        <PerformancePage title="Edit User" description="Update basic account details and access assignments." breadcrumbs={breadcrumbs}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit User</CardTitle>
                    <CardDescription>Update identity details, role membership, and direct permissions.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 p-6 pt-0">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-sm">
                                Name
                                <Input value={data.name} onChange={(event) => setData('name', event.target.value)} />
                            </label>
                            <label className="grid gap-2 text-sm">
                                Email
                                <Input type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} />
                            </label>
                            <label className="grid gap-2 text-sm">
                                New password
                                <Input type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} placeholder="Leave blank to keep current password" />
                            </label>
                            <label className="grid gap-2 text-sm">
                                Confirm password
                                <Input type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} />
                            </label>
                        </div>

                        <label className="grid gap-2 text-sm">
                            Roles
                            <select
                                multiple
                                className="min-h-36 rounded-md border bg-background px-3 py-2"
                                value={data.role_ids.map(String)}
                                onChange={(event) => setData('role_ids', Array.from(event.target.selectedOptions).map((option) => Number(option.value)))}
                            >
                                {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                            {permissionGroups.map((group) => (
                                <div key={group.group} className="rounded-lg border p-4">
                                    <div className="mb-3 font-medium">{group.group}</div>
                                    <div className="space-y-2 text-sm">
                                        {group.permissions.map((permission) => (
                                            <label key={permission.id} className="flex items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={data.permission_ids.includes(permission.id)}
                                                    onChange={(event) =>
                                                        setData(
                                                            'permission_ids',
                                                            event.target.checked
                                                                ? [...data.permission_ids, permission.id]
                                                                : data.permission_ids.filter((id) => id !== permission.id),
                                                        )
                                                    }
                                                />
                                                <span>{permission.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {userRecord.employee_profile ? (
                            <div className="rounded-lg border p-4 text-sm">
                                Linked employee profile: {userRecord.employee_profile.employee_number}
                            </div>
                        ) : null}

                        <Button type="submit" disabled={processing}>
                            Update User
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
