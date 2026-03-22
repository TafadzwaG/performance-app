import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Option, ReviewCycle } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    reviewCycle: ReviewCycle;
    employeeProfileOptions: Option[];
    templateOptions: Option[];
}

const breadcrumbs = (cycle: ReviewCycle): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Review Cycles', href: route('performance.review_cycles.index') },
    { title: cycle.name, href: route('performance.review_cycles.show', cycle.id) },
    { title: 'Assign Employees', href: route('performance.review_cycles.assign', cycle.id) },
];

export default function AssignEmployees({ reviewCycle, employeeProfileOptions, templateOptions }: Props) {
    const { data, setData, post, processing } = useForm<{ template_id: string; employee_profile_ids: number[] }>({
        template_id: '',
        employee_profile_ids: [],
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.review_cycles.assign.store', reviewCycle.id));
    };

    return (
        <PerformancePage title="Assign Employees" description="Generate appraisals for employees in this cycle." breadcrumbs={breadcrumbs(reviewCycle)}>
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="grid gap-4">
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.template_id} onChange={(event) => setData('template_id', event.target.value)}>
                            <option value="">Template</option>
                            {templateOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            multiple
                            className="min-h-64 rounded-md border bg-background px-3 py-2 text-sm"
                            value={data.employee_profile_ids.map(String)}
                            onChange={(event) => setData('employee_profile_ids', Array.from(event.target.selectedOptions).map((option) => Number(option.value)))}
                        >
                            {employeeProfileOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <Button type="submit" disabled={processing}>
                            Assign Selected Employees
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
