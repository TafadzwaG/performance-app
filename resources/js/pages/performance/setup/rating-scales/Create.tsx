import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface ScaleLevelForm {
    label: string;
    short_label: string;
    value: number;
    min_percent: number | null;
    max_percent: number | null;
    color: string;
    sort_order: number;
    is_default: boolean;
    [key: string]: FormDataConvertible;
}

interface RatingScaleForm {
    name: string;
    code: string;
    applies_to: string;
    description: string;
    is_active: boolean;
    levels: ScaleLevelForm[];
    [key: string]: FormDataConvertible;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Rating Scales', href: route('performance.setup.rating_scales.index') },
    { title: 'Create', href: route('performance.setup.rating_scales.create') },
];

export default function RatingScaleCreate() {
    const { data, setData, post, processing } = useForm<RatingScaleForm>({
        name: '',
        code: '',
        applies_to: 'objective',
        description: '',
        is_active: true,
        levels: [
            { label: 'Level 1', short_label: '1', value: 1, min_percent: null, max_percent: null, color: '', sort_order: 0, is_default: true },
        ] as ScaleLevelForm[],
    });

    const updateLevel = (index: number, field: keyof ScaleLevelForm, value: boolean | number | string | null) => {
        const next = [...data.levels];
        next[index] = { ...next[index], [field]: value };
        setData('levels', next);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.setup.rating_scales.store'));
    };

    return (
        <PerformancePage title="Create Rating Scale" description="Add a rating scale and define its levels." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.name} onChange={(event) => setData('name', event.target.value)} placeholder="Name" />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.code} onChange={(event) => setData('code', event.target.value)} placeholder="Code" />
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.applies_to} onChange={(event) => setData('applies_to', event.target.value)}>
                                <option value="objective">Objective</option>
                                <option value="competency">Competency</option>
                                <option value="overall">Overall</option>
                            </select>
                        </div>
                        <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={data.description} onChange={(event) => setData('description', event.target.value)} placeholder="Description" />
                        <div className="space-y-3">
                            {data.levels.map((level, index) => (
                                <div key={`level-${index}`} className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
                                    <input className="rounded-md border bg-background px-3 py-2 text-sm" value={level.label} onChange={(event) => updateLevel(index, 'label', event.target.value)} placeholder="Label" />
                                    <input className="rounded-md border bg-background px-3 py-2 text-sm" value={level.short_label} onChange={(event) => updateLevel(index, 'short_label', event.target.value)} placeholder="Short label" />
                                    <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={level.value} onChange={(event) => updateLevel(index, 'value', Number(event.target.value))} placeholder="Value" />
                                    <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={level.sort_order} onChange={(event) => updateLevel(index, 'sort_order', Number(event.target.value))} placeholder="Sort order" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setData('levels', [
                                        ...data.levels,
                                        {
                                            label: `Level ${data.levels.length + 1}`,
                                            short_label: '',
                                            value: data.levels.length + 1,
                                            min_percent: null,
                                            max_percent: null,
                                            color: '',
                                            sort_order: data.levels.length,
                                            is_default: false,
                                        },
                                    ])
                                }
                            >
                                Add Level
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save Rating Scale
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
