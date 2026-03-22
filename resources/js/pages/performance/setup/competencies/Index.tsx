import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Competency, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Props {
    competencies: Paginated<Competency>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Competencies', href: route('performance.setup.competencies.index') },
];

export default function CompetenciesIndex({ competencies, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.setup.competencies.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <PerformancePage
            title="Competencies"
            description="Maintain values, behaviours, and competency definitions."
            breadcrumbs={breadcrumbs}
            primaryAction={can.create ? { label: 'New Competency', href: route('performance.setup.competencies.create') } : undefined}
        >
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="flex gap-2">
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search competencies" />
                        <Button type="submit" variant="outline">
                            Filter
                        </Button>
                    </form>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Department</th>
                                    <th className="p-3">Job Title</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {competencies.data.map((competency) => (
                                    <tr key={competency.id} className="border-t">
                                        <td className="p-3">{competency.name}</td>
                                        <td className="p-3">{competency.category}</td>
                                        <td className="p-3">{competency.department?.name ?? '-'}</td>
                                        <td className="p-3">{competency.job_title?.name ?? '-'}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.setup.competencies.show', competency.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.setup.competencies.edit', competency.id)}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={competencies} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
