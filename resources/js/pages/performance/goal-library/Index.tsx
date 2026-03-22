import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { GoalLibraryItem, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Props {
    goalLibraryItems: Paginated<GoalLibraryItem>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Goal Library', href: route('performance.goal_library.index') },
];

export default function GoalLibraryIndex({ goalLibraryItems, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.goal_library.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <PerformancePage
            title="Goal Library"
            description="Reusable SMART goals for departments, roles, and perspectives."
            breadcrumbs={breadcrumbs}
            primaryAction={can.create ? { label: 'New Goal', href: route('performance.goal_library.create') } : undefined}
        >
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="flex gap-2">
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search goal library" />
                        <Button type="submit" variant="outline">
                            Filter
                        </Button>
                    </form>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3">Title</th>
                                    <th className="p-3">Perspective</th>
                                    <th className="p-3">Department</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {goalLibraryItems.data.map((item) => (
                                    <tr key={item.id} className="border-t">
                                        <td className="p-3">{item.title}</td>
                                        <td className="p-3">{item.perspective?.name ?? '-'}</td>
                                        <td className="p-3">{item.department?.name ?? '-'}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.goal_library.show', item.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.goal_library.edit', item.id)}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={goalLibraryItems} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
