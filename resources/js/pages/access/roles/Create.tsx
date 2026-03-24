import RoleForm, { type PermissionGroup, type RoleFormData, type UserOption } from '@/components/access/roles/RoleForm';
import PerformancePage from '@/components/performance/PerformancePage';
import type { BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    permissionGroups: PermissionGroup[];
    userOptions: UserOption[];
}

export default function RoleCreate({ permissionGroups, userOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Roles', href: route('access.roles.index') },
        { title: 'Create', href: route('access.roles.create') },
    ];

    const { data, setData, post, processing, errors } = useForm<RoleFormData>({
        name: '',
        permission_ids: [],
        user_ids: [],
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('access.roles.store'));
    };

    return (
        <PerformancePage
            title="Create Role"
            description="Define a new role, assign permissions, and attach users."
            breadcrumbs={breadcrumbs}
        >
            <RoleForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                permissionGroups={permissionGroups}
                userOptions={userOptions}
                cancelHref={route('access.roles.index')}
                submitLabel="Create Role"
                onSubmit={submit}
            />
        </PerformancePage>
    );
}
