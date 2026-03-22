import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Competency, Option } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
    competency: Competency;
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

export default function CompetencyEdit({ competency, departmentOptions, jobTitleOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Competencies', href: route('performance.setup.competencies.index') },
        { title: competency.name, href: route('performance.setup.competencies.show', competency.id) },
        { title: 'Edit', href: route('performance.setup.competencies.edit', competency.id) },
    ];

    const { data, setData, put, processing } = useForm<CompetencyForm>({
        name: competency.name,
        code: competency.code,
        description: competency.description ?? '',
        category: competency.category,
        department_id: competency.department_id ? String(competency.department_id) : '',
        job_title_id: competency.job_title_id ? String(competency.job_title_id) : '',
        is_active: competency.is_active,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.setup.competencies.update', competency.id));
    };

    return (
        <PerformancePage title="Edit Competency" description="Update competency details." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.name} onChange={(event) => setData('name', event.target.value)} />
                        <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.code} onChange={(event) => setData('code', event.target.value)} />
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
                        <textarea className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" value={data.description} onChange={(event) => setData('description', event.target.value)} />
                        <div className="md:col-span-2">
                            <Button type="submit" disabled={processing}>
                                Update Competency
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
