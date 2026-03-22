import PerformancePage from '@/components/performance/PerformancePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { RatingScale, RatingScaleLevel } from '@/types/performance';
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

const mapLevel = (level: RatingScaleLevel, index: number): ScaleLevelForm => ({
    label: level.label,
    short_label: level.short_label ?? '',
    value: level.value,
    min_percent: level.min_percent ?? null,
    max_percent: level.max_percent ?? null,
    color: level.color ?? '',
    sort_order: level.sort_order ?? index,
    is_default: level.is_default ?? false,
});

export default function RatingScaleEdit({ ratingScale }: { ratingScale: RatingScale }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Rating Scales', href: route('performance.setup.rating_scales.index') },
        { title: ratingScale.name, href: route('performance.setup.rating_scales.show', ratingScale.id) },
        { title: 'Edit', href: route('performance.setup.rating_scales.edit', ratingScale.id) },
    ];

    const { data, setData, put, processing } = useForm<RatingScaleForm>({
        name: ratingScale.name,
        code: ratingScale.code,
        applies_to: ratingScale.applies_to,
        description: ratingScale.description ?? '',
        is_active: ratingScale.is_active,
        levels: (ratingScale.levels ?? []).map(mapLevel),
    });

    const updateLevel = (index: number, field: keyof ScaleLevelForm, value: boolean | number | string | null) => {
        const next = [...data.levels];
        next[index] = { ...next[index], [field]: value };
        setData('levels', next);
    };

    const addLevel = () => {
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
        ]);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.setup.rating_scales.update', ratingScale.id));
    };

    return (
        <PerformancePage title="Edit Rating Scale" description="Update scale metadata and levels." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.name} onChange={(event) => setData('name', event.target.value)} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.code} onChange={(event) => setData('code', event.target.value)} />
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.applies_to} onChange={(event) => setData('applies_to', event.target.value)}>
                                <option value="objective">Objective</option>
                                <option value="competency">Competency</option>
                                <option value="overall">Overall</option>
                            </select>
                        </div>
                        <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={data.description} onChange={(event) => setData('description', event.target.value)} />
                        <div className="space-y-3">
                            {data.levels.map((level, index) => (
                                <div key={`level-${index}`} className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
                                    <input className="rounded-md border bg-background px-3 py-2 text-sm" value={level.label} onChange={(event) => updateLevel(index, 'label', event.target.value)} />
                                    <input className="rounded-md border bg-background px-3 py-2 text-sm" value={level.short_label} onChange={(event) => updateLevel(index, 'short_label', event.target.value)} />
                                    <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={level.value} onChange={(event) => updateLevel(index, 'value', Number(event.target.value))} />
                                    <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={level.sort_order} onChange={(event) => updateLevel(index, 'sort_order', Number(event.target.value))} />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={addLevel}>
                                Add Level
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update Rating Scale
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
