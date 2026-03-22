import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Department, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

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

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.setup.departments.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <PerformancePage
            title="Departments"
            description="Maintain the departments available for performance planning and reporting."
            breadcrumbs={breadcrumbs}
            primaryAction={can.create ? { label: 'New Department', href: route('performance.setup.departments.create') } : undefined}
        >
            <Card>
                <CardContent className="space-y-4 p-6">
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
                                {departments.data.map((department) => (
                                    <tr key={department.id} className="border-t">
                                        <td className="p-3">{department.name}</td>
                                        <td className="p-3">{department.code}</td>
                                        <td className="p-3">{department.is_active ? 'Active' : 'Inactive'}</td>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={departments} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
