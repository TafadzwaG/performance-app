import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { AccessUserRecord, Paginated } from '@/types/performance';
import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    users: Paginated<AccessUserRecord>;
    filters: { search: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Users', href: route('access.users.index') },
];

export default function UsersIndex({ users, filters }: Props) {
    const searchForm = useForm({
        search: filters.search ?? '',
    });

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        searchForm.get(route('access.users.index'), { preserveState: true, replace: true });
    };

    return (
        <PerformancePage title="Users" description="Manage account details, roles, and direct permissions." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submitSearch} className="flex gap-2">
                        <Input value={searchForm.data.search} onChange={(event) => searchForm.setData('search', event.target.value)} placeholder="Search users by name, email, or employee number" />
                        <Button type="submit" variant="outline">
                            Filter
                        </Button>
                    </form>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3">User</th>
                                    <th className="p-3">Employee Profile</th>
                                    <th className="p-3">Roles</th>
                                    <th className="p-3">Direct Permissions</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <tr key={user.id} className="border-t">
                                        <td className="p-3">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </td>
                                        <td className="p-3">{user.employee_profile?.employee_number ?? '-'}</td>
                                        <td className="p-3">{user.roles?.map((role) => role.name).join(', ') || 'None assigned'}</td>
                                        <td className="p-3">{user.permissions?.length ?? 0}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('access.users.show', user.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('access.users.edit', user.id)}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={users} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
