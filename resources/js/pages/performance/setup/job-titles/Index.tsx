import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { JobTitle, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Props {
    jobTitles: Paginated<JobTitle>;
    filters: { search: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Job Titles', href: '/performance/setup/job-titles' },
];

export default function JobTitlesIndex({ jobTitles, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.setup.job_titles.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <PerformancePage
            title="Job Titles"
            description="Manage the job title catalogue used for employee profiles and templates."
            breadcrumbs={breadcrumbs}
            primaryAction={can.create ? { label: 'New Job Title', href: route('performance.setup.job_titles.create') } : undefined}
        >
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="flex gap-2">
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job titles" />
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
                                {jobTitles.data.map((jobTitle) => (
                                    <tr key={jobTitle.id} className="border-t">
                                        <td className="p-3">{jobTitle.name}</td>
                                        <td className="p-3">{jobTitle.code}</td>
                                        <td className="p-3">{jobTitle.is_active ? 'Active' : 'Inactive'}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.setup.job_titles.show', jobTitle.id)}>View</Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route('performance.setup.job_titles.edit', jobTitle.id)}>Edit</Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={jobTitles} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
