import type { GoalLibraryItem, Option } from '@/types/performance';
import GoalLibraryCreate from './Create';

export default function GoalLibraryEdit({ goalLibraryItem, departmentOptions, jobTitleOptions, perspectiveOptions }: { goalLibraryItem: GoalLibraryItem; departmentOptions: Option[]; jobTitleOptions: Option[]; perspectiveOptions: Option[] }) {
    return <GoalLibraryEditForm goalLibraryItem={goalLibraryItem} departmentOptions={departmentOptions} jobTitleOptions={jobTitleOptions} perspectiveOptions={perspectiveOptions} />;
}

import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

function GoalLibraryEditForm({ goalLibraryItem, departmentOptions, jobTitleOptions, perspectiveOptions }: { goalLibraryItem: GoalLibraryItem; departmentOptions: Option[]; jobTitleOptions: Option[]; perspectiveOptions: Option[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Goal Library', href: route('performance.goal_library.index') },
        { title: goalLibraryItem.title, href: route('performance.goal_library.show', goalLibraryItem.id) },
        { title: 'Edit', href: route('performance.goal_library.edit', goalLibraryItem.id) },
    ];

    const { data, setData, put, processing } = useForm({
        department_id: goalLibraryItem.department_id ? String(goalLibraryItem.department_id) : '',
        job_title_id: goalLibraryItem.job_title_id ? String(goalLibraryItem.job_title_id) : '',
        perspective_id: String(goalLibraryItem.perspective_id),
        title: goalLibraryItem.title,
        description: goalLibraryItem.description ?? '',
        kpi_measure: goalLibraryItem.kpi_measure ?? '',
        target_definition: goalLibraryItem.target_definition ?? '',
        default_weight: goalLibraryItem.default_weight ?? 25,
        evidence_source: goalLibraryItem.evidence_source ?? '',
        timeline_days: goalLibraryItem.timeline_days ?? 90,
        is_active: goalLibraryItem.is_active,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.goal_library.update', goalLibraryItem.id));
    };

    return (
        <PerformancePage title="Edit Goal Library Item" description="Update a reusable SMART objective." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.department_id} onChange={(event) => setData('department_id', event.target.value)}>
                            <option value="">Department</option>
                            {departmentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.job_title_id} onChange={(event) => setData('job_title_id', event.target.value)}>
                            <option value="">Job title</option>
                            {jobTitleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.perspective_id} onChange={(event) => setData('perspective_id', event.target.value)}>
                            {perspectiveOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.title} onChange={(event) => setData('title', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.kpi_measure} onChange={(event) => setData('kpi_measure', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.evidence_source} onChange={(event) => setData('evidence_source', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.default_weight} onChange={(event) => setData('default_weight', Number(event.target.value))} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.timeline_days} onChange={(event) => setData('timeline_days', Number(event.target.value))} />
                        <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" value={data.description} onChange={(event) => setData('description', event.target.value)} />
                        <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" value={data.target_definition} onChange={(event) => setData('target_definition', event.target.value)} />
                        <div className="md:col-span-2">
                            <Button type="submit" disabled={processing}>
                                Update Goal
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
