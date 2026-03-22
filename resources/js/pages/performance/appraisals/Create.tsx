import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    reviewCycleOptions: Option[];
    employeeProfileOptions: Option[];
    templateOptions: Option[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: 'Create', href: route('performance.appraisals.create') },
];

export default function AppraisalCreate({ reviewCycleOptions, employeeProfileOptions, templateOptions }: Props) {
    const { data, setData, post, processing } = useForm({
        review_cycle_id: '',
        employee_profile_id: '',
        template_id: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.appraisals.store'));
    };

    return (
        <PerformancePage title="Create Appraisal" description="Create a manual appraisal assignment for a cycle." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
                        <label className="grid gap-2 text-sm">
                            Review cycle
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.review_cycle_id} onChange={(event) => setData('review_cycle_id', event.target.value)}>
                                <option value="">Select cycle</option>
                                {reviewCycleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-2 text-sm">
                            Employee
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.employee_profile_id} onChange={(event) => setData('employee_profile_id', event.target.value)}>
                                <option value="">Select employee</option>
                                {employeeProfileOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-2 text-sm">
                            Template
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.template_id} onChange={(event) => setData('template_id', event.target.value)}>
                                <option value="">Select template</option>
                                {templateOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="md:col-span-3">
                            <Button type="submit" disabled={processing}>
                                Create Appraisal
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
