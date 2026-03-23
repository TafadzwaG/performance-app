import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Department, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Props {
    departments: Paginated<Department>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Departments', href: '/performance/setup/departments' },
];

export default function DepartmentsIndex({ departments, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const activeCount = departments.data.filter((department) => department.is_active).length;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.setup.departments.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <PerformancePage
            title="Departments"
            description="Maintain departments used in employee setup, planning, and reporting."
            breadcrumbs={breadcrumbs}
            primaryAction={can.create ? { label: 'New Department', href: route('performance.setup.departments.create') } : undefined}
        >
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Departments On This Page</CardDescription>
                            <CardTitle>{departments.data.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Active Departments</CardDescription>
                            <CardTitle>{activeCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Results</CardDescription>
                            <CardTitle>{departments.total}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Department Catalogue</CardTitle>
                        <CardDescription>Search and manage the department list used throughout performance management.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={submit} className="flex gap-2">
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search departments" />
                            <Button type="submit" variant="outline">
                                Filter
                            </Button>
                        </form>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Code</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.data.length > 0 ? (
                                        departments.data.map((department) => (
                                            <tr key={department.id} className="border-t">
                                                <td className="p-3">
                                                    <div className="font-medium">{department.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {department.description ?? 'No description'}
                                                    </div>
                                                </td>
                                                <td className="p-3">{department.code}</td>
                                                <td className="p-3">
                                                    <Badge variant={department.is_active ? 'secondary' : 'outline'}>
                                                        {department.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={route('performance.setup.departments.show', department.id)}>View</Link>
                                                        </Button>
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={route('performance.setup.departments.edit', department.id)}>Edit</Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                                                No departments found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationLinks paginated={departments} />
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
