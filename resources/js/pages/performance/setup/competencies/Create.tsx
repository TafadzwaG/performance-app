import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    departmentOptions: Option[];
    jobTitleOptions: Option[];
}

interface CompetencyForm {
    name: string;
    code: string;
    description: string;
    category: string;
    department_id: string;
    job_title_id: string;
    is_active: boolean;
    [key: string]: FormDataConvertible;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Competencies', href: route('performance.setup.competencies.index') },
    { title: 'Create', href: route('performance.setup.competencies.create') },
];

export default function CompetencyCreate({ departmentOptions, jobTitleOptions }: Props) {
    const { data, setData, post, processing } = useForm<CompetencyForm>({
        name: '',
        code: '',
        description: '',
        category: 'competency',
        department_id: '',
        job_title_id: '',
        is_active: true,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.setup.competencies.store'));
    };

    return (
        <PerformancePage title="Create Competency" description="Add a competency, behaviour, or value definition." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.name} onChange={(event) => setData('name', event.target.value)} placeholder="Name" />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.code} onChange={(event) => setData('code', event.target.value)} placeholder="Code" />
                        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.category} onChange={(event) => setData('category', event.target.value)}>
                            <option value="competency">Competency</option>
                            <option value="value">Value</option>
                            <option value="behaviour">Behaviour</option>
                        </select>
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
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={data.is_active} onChange={(event) => setData('is_active', event.target.checked)} />
                            Active
                        </label>
                        <textarea className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" value={data.description} onChange={(event) => setData('description', event.target.value)} placeholder="Description" />
                        <div className="md:col-span-2">
                            <Button type="submit" disabled={processing}>
                                Save Competency
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
