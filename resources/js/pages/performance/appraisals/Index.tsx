import AppraisalStatusBadge from '@/components/performance/AppraisalStatusBadge';
import PaginationLinks from '@/components/performance/PaginationLinks';
import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Appraisal, Paginated } from '@/types/performance';
import { Link, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';

interface Props {
    appraisals: Paginated<Appraisal>;
    filters: { search: string; status: string };
    can: { create: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: '/performance/appraisals' },
];

export default function AppraisalsIndex({ appraisals, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('performance.appraisals.index'), { search, status }, { preserveState: true, replace: true });
    };

    return (
        <PerformancePage
            title="Appraisals"
            description="Track cycle appraisals across planning, review, approval, and finalization."
            breadcrumbs={breadcrumbs}
            primaryAction={can.create ? { label: 'Create Appraisal', href: route('performance.appraisals.create') } : undefined}
        >
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="flex flex-wrap gap-2">
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search appraisals" className="max-w-sm" />
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
                            <option value="">All statuses</option>
                            <option value="draft">Draft</option>
                            <option value="goal_setting">Goal setting</option>
                            <option value="self_assessment_pending">Self assessment pending</option>
                            <option value="manager_review_pending">Manager review pending</option>
                            <option value="approval_pending">Approval pending</option>
                            <option value="approved">Approved</option>
                            <option value="finalized">Finalized</option>
                        </select>
                        <Button type="submit" variant="outline">
                            Filter
                        </Button>
                    </form>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="p-3">Employee</th>
                                    <th className="p-3">Cycle</th>
                                    <th className="p-3">Template</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Overall</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appraisals.data.map((appraisal) => (
                                    <tr key={appraisal.id} className="border-t">
                                        <td className="p-3">
                                            <div className="font-medium">{appraisal.employee_name_snapshot}</div>
                                            <div className="text-xs text-muted-foreground">{appraisal.employee_number_snapshot}</div>
                                        </td>
                                        <td className="p-3">{appraisal.cycle_name_snapshot}</td>
                                        <td className="p-3">{appraisal.template_name_snapshot}</td>
                                        <td className="p-3">
                                            <AppraisalStatusBadge status={appraisal.status} />
                                        </td>
                                        <td className="p-3">{appraisal.overall_score ?? '-'}</td>
                                        <td className="p-3">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={route('performance.appraisals.show', appraisal.id)}>Open</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks paginated={appraisals} />
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
