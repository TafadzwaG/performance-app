import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Review Cycles', href: route('performance.review_cycles.index') },
    { title: 'Create', href: route('performance.review_cycles.create') },
];

export default function ReviewCycleCreate() {
    const { data, setData, post, processing } = useForm({
        name: '',
        code: '',
        description: '',
        start_date: '',
        end_date: '',
        goal_setting_deadline: '',
        self_assessment_deadline: '',
        manager_review_deadline: '',
        approval_deadline: '',
        status: 'draft',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.review_cycles.store'));
    };

    return (
        <PerformancePage title="Create Review Cycle" description="Add the dates and workflow windows for a performance cycle." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.name} onChange={(event) => setData('name', event.target.value)} placeholder="Name" />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.code} onChange={(event) => setData('code', event.target.value)} placeholder="Code" />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="date" value={data.start_date} onChange={(event) => setData('start_date', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="date" value={data.end_date} onChange={(event) => setData('end_date', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="date" value={data.goal_setting_deadline} onChange={(event) => setData('goal_setting_deadline', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="date" value={data.self_assessment_deadline} onChange={(event) => setData('self_assessment_deadline', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="date" value={data.manager_review_deadline} onChange={(event) => setData('manager_review_deadline', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" type="date" value={data.approval_deadline} onChange={(event) => setData('approval_deadline', event.target.value)} />
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.status} onChange={(event) => setData('status', event.target.value)}>
                            <option value="draft">Draft</option>
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                        </select>
                        <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" value={data.description} onChange={(event) => setData('description', event.target.value)} placeholder="Description" />
                        <div className="md:col-span-2">
                            <Button type="submit" disabled={processing}>
                                Save Review Cycle
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
