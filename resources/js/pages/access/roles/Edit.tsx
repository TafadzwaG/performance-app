import RoleForm, { type PermissionGroup, type RoleFormData, type UserOption } from '@/components/access/roles/RoleForm';
import PerformancePage from '@/components/performance/PerformancePage';
import type { BreadcrumbItem } from '@/types';
import type { RoleRecord } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    role: RoleRecord;
    permissionGroups: PermissionGroup[];
    userOptions: UserOption[];
}

export default function RoleEdit({ role, permissionGroups, userOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Roles', href: route('access.roles.index') },
        { title: role.name, href: route('access.roles.show', { role: role.id }) },
        { title: 'Edit', href: route('access.roles.edit', { role: role.id }) },
    ];

    const { data, setData, put, processing, errors } = useForm<RoleFormData>({
        name: role.name,
        permission_ids: role.permissions?.map((permission) => permission.id) ?? [],
        user_ids: role.users?.map((user) => user.id) ?? [],
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('access.roles.update', { role: role.id }));
    };

    return (
        <PerformancePage
            title="Edit Role"
            description="Update role membership and permission assignment."
            breadcrumbs={breadcrumbs}
        >
            <RoleForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                permissionGroups={permissionGroups}
                userOptions={userOptions}
                cancelHref={route('access.roles.show', { role: role.id })}
                submitLabel="Update Role"
                onSubmit={submit}
            />
        </PerformancePage>
    );
}
