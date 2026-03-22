import PerformancePage from '@/components/performance/PerformancePage';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';
import type { Perspective } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function PerspectiveEdit({ perspective }: { perspective: Perspective }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Perspectives', href: route('performance.setup.perspectives.index') },
        { title: perspective.name, href: route('performance.setup.perspectives.edit', perspective.id) },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: perspective.name,
        code: perspective.code,
        description: perspective.description ?? '',
        sort_order: perspective.sort_order,
        is_active: perspective.is_active,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.setup.perspectives.update', perspective.id));
    };

    return (
        <PerformancePage title="Edit Perspective" description="Update perspective details." breadcrumbs={breadcrumbs}>
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
                            Sort order
                            <Input type="number" value={data.sort_order} onChange={(event) => setData('sort_order', Number(event.target.value))} />
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
                            Update Perspective
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
