import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, Perspective } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Props {
    perspectives: Paginated<Perspective>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Perspectives', href: '/performance/setup/perspectives' },
];

export default function PerspectivesIndex({ perspectives, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.setup.perspectives.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <PerformancePage
            title="Perspectives"
            description="Manage strategic perspectives used in templates and objectives."
            breadcrumbs={breadcrumbs}
            primaryAction={can.create ? { label: 'New Perspective', href: route('performance.setup.perspectives.create') } : undefined}
        >
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="flex gap-2">
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search perspectives" />
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
                                    <th className="p-3">Sort Order</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perspectives.data.map((perspective) => (
                                    <tr key={perspective.id} className="border-t">
                                        <td className="p-3">{perspective.name}</td>
                                        <td className="p-3">{perspective.code}</td>
                                        <td className="p-3">{perspective.sort_order}</td>
                                        <td className="p-3">{perspective.is_active ? 'Active' : 'Inactive'}</td>
                                        <td className="p-3">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={route('performance.setup.perspectives.edit', perspective.id)}>Edit</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={perspectives} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
