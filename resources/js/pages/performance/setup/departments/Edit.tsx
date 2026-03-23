import PerformancePage from '@/components/performance/PerformancePage';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Department } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function DepartmentEdit({ department }: { department: Department }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Departments', href: route('performance.setup.departments.index') },
        { title: department.name, href: route('performance.setup.departments.show', department.id) },
        { title: 'Edit', href: route('performance.setup.departments.edit', department.id) },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: department.name,
        code: department.code,
        description: department.description ?? '',
        is_active: department.is_active,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.setup.departments.update', department.id));
    };

    return (
        <PerformancePage title="Edit Department" description="Update department details and status." breadcrumbs={breadcrumbs}>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Department</CardTitle>
                    <CardDescription>Maintain naming, code, and descriptive context for this department.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
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
                        <label className="grid gap-2 text-sm md:col-span-2">
                            Description
                            <textarea className="min-h-28 rounded-md border bg-background px-3 py-2" value={data.description} onChange={(event) => setData('description', event.target.value)} />
                        </label>
                        <label className="flex items-center gap-2 text-sm md:col-span-2">
                            <input type="checkbox" checked={data.is_active} onChange={(event) => setData('is_active', event.target.checked)} />
                            Active
                        </label>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" disabled={processing}>
                                Update Department
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
