import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Paginated, RatingScale } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Props {
    ratingScales: Paginated<RatingScale>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Rating Scales', href: route('performance.setup.rating_scales.index') },
];

export default function RatingScalesIndex({ ratingScales, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.setup.rating_scales.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <PerformancePage
            title="Rating Scales"
            description="Configure objective, competency, and overall performance rating scales."
            breadcrumbs={breadcrumbs}
            primaryAction={can.create ? { label: 'New Rating Scale', href: route('performance.setup.rating_scales.create') } : undefined}
        >
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="flex gap-2">
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rating scales" />
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
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Levels</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ratingScales.data.map((scale) => (
                                    <tr key={scale.id} className="border-t">
                                        <td className="p-3">{scale.name}</td>
                                        <td className="p-3">{scale.code}</td>
                                        <td className="p-3">{scale.applies_to}</td>
                                        <td className="p-3">{scale.levels?.length ?? 0}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.setup.rating_scales.show', scale.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.setup.rating_scales.edit', scale.id)}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={ratingScales} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
