import PerformancePage from '@/components/performance/PerformancePage';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { JobTitle } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function JobTitleEdit({ jobTitle }: { jobTitle: JobTitle }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Job Titles', href: route('performance.setup.job_titles.index') },
        { title: jobTitle.name, href: route('performance.setup.job_titles.show', jobTitle.id) },
        { title: 'Edit', href: route('performance.setup.job_titles.edit', jobTitle.id) },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: jobTitle.name,
        code: jobTitle.code,
        description: jobTitle.description ?? '',
        is_active: jobTitle.is_active,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.setup.job_titles.update', jobTitle.id));
    };

    return (
        <PerformancePage title="Edit Job Title" description="Update job title details." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="grid gap-4">
                        <label className="grid gap-2 text-sm">
                            Name
                            <Input value={data.name} onChange={(event) => setData('name', event.target.value)} />
                            <InputError message={errors.name} />
                        </label>
                        <label className="grid gap-2 text-sm">
                            Code
                            <Input value={data.code} onChange={(event) => setData('code', event.target.value)} />
                            <InputError message={errors.code} />
                        </label>
                        <label className="grid gap-2 text-sm">
                            Description
                            <textarea className="min-h-28 rounded-md border bg-background px-3 py-2" value={data.description} onChange={(event) => setData('description', event.target.value)} />
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={data.is_active} onChange={(event) => setData('is_active', event.target.checked)} />
                            Active
                        </label>
                        <Button type="submit" disabled={processing}>
                            Update Job Title
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
