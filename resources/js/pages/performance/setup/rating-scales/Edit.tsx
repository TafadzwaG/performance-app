import PerformancePage from '@/components/performance/PerformancePage';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import type { RatingScale, RatingScaleLevel } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import {
    Eye,
    FilePenLine,
    Info,
    Layers3,
    Lightbulb,
    Palette,
    PencilLine,
    Plus,
    Save,
    ShieldCheck,
    Trash2,
    TrendingUp,
} from 'lucide-react';
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

const typeOptions = [
    { value: 'objective', label: 'Objective' },
    { value: 'competency', label: 'Competency' },
    { value: 'overall', label: 'Overall' },
];

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

function buildLevel(index: number): ScaleLevelForm {
    return {
        label: `Level ${index + 1}`,
        short_label: `${index + 1}`,
        value: index + 1,
        min_percent: null,
        max_percent: null,
        color: '',
        sort_order: index,
        is_default: false,
    };
}

export default function RatingScaleEdit({ ratingScale }: { ratingScale: RatingScale }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Rating Scales', href: route('performance.setup.rating_scales.index') },
        { title: ratingScale.name, href: route('performance.setup.rating_scales.show', ratingScale.id) },
        { title: 'Edit', href: route('performance.setup.rating_scales.edit', ratingScale.id) },
    ];

    const { data, setData, put, processing, errors } = useForm<RatingScaleForm>({
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

    const setDefaultLevel = (index: number) => {
        setData(
            'levels',
            data.levels.map((level, levelIndex) => ({
                ...level,
                is_default: levelIndex === index,
            })),
        );
    };

    const addLevel = () => {
        setData('levels', [...data.levels, buildLevel(data.levels.length)]);
    };

    const removeLevel = (index: number) => {
        if (data.levels.length === 1) return;

        const next = data.levels.filter((_, levelIndex) => levelIndex !== index).map((level, levelIndex) => ({
            ...level,
            sort_order: levelIndex,
            is_default: level.is_default && levelIndex !== 0 ? false : level.is_default,
        }));

        if (!next.some((level) => level.is_default)) {
            next[0] = { ...next[0], is_default: true };
        }

        setData('levels', next);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.setup.rating_scales.update', ratingScale.id));
    };

    return (
        <PerformancePage
            title="Edit Rating Scale"
            description="Update scale metadata, ordering, and level definitions."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Scoring framework
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Rating Scale</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Maintain the scoring scale used to evaluate objectives, competencies, or overall performance.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                Update Rating Scale
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 space-y-6 lg:col-span-8">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                            <FilePenLine className="h-5 w-5 text-muted-foreground" />
                                        </div>

                                        <div>
                                            <CardTitle className="text-lg">Identity & Type</CardTitle>
                                            <CardDescription>
                                                Maintain the scale name, code, applies-to type, and descriptive usage context.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <Badge variant="outline">Editable</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Scale Name</Label>
                                        <Input id="name" value={data.name} onChange={(event) => setData('name', event.target.value)} />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Scale Code</Label>
                                        <Input id="code" value={data.code} onChange={(event) => setData('code', event.target.value)} />
                                        <InputError message={errors.code} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="applies_to">Applies To</Label>
                                        <Select value={data.applies_to} onValueChange={(value) => setData('applies_to', value)}>
                                            <SelectTrigger id="applies_to">
                                                <SelectValue placeholder="Choose scale type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {typeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.applies_to} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="description">Description & Usage Guidance</Label>
                                        <textarea
                                            id="description"
                                            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            value={data.description}
                                            onChange={(event) => setData('description', event.target.value)}
                                        />
                                        <InputError message={errors.description} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                            <Layers3 className="h-5 w-5 text-muted-foreground" />
                                        </div>

                                        <div>
                                            <CardTitle className="text-lg">Scale Levels</CardTitle>
                                            <CardDescription>
                                                Update ordered levels, values, optional percentage bands, and the default level.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <Button type="button" variant="outline" size="sm" onClick={addLevel}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Level
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 p-6">
                                <InputError message={errors.levels} />

                                {data.levels.map((level, index) => (
                                    <div key={`level-${index}`} className="rounded-xl border bg-muted/10 p-5">
                                        <div className="mb-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Level {index + 1}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Ordered rating level used during appraisal scoring.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {level.is_default ? <Badge variant="secondary">Default</Badge> : null}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeLevel(index)}
                                                    disabled={data.levels.length === 1}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`levels.${index}.label`}>Label</Label>
                                                <Input
                                                    id={`levels.${index}.label`}
                                                    value={level.label}
                                                    onChange={(event) => updateLevel(index, 'label', event.target.value)}
                                                />
                                                <InputError message={errors[`levels.${index}.label`]} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`levels.${index}.short_label`}>Short Label</Label>
                                                <Input
                                                    id={`levels.${index}.short_label`}
                                                    value={level.short_label}
                                                    onChange={(event) => updateLevel(index, 'short_label', event.target.value)}
                                                />
                                                <InputError message={errors[`levels.${index}.short_label`]} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`levels.${index}.value`}>Numeric Value</Label>
                                                <Input
                                                    id={`levels.${index}.value`}
                                                    type="number"
                                                    value={level.value}
                                                    onChange={(event) => updateLevel(index, 'value', Number(event.target.value))}
                                                />
                                                <InputError message={errors[`levels.${index}.value`]} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`levels.${index}.sort_order`}>Sort Order</Label>
                                                <Input
                                                    id={`levels.${index}.sort_order`}
                                                    type="number"
                                                    value={level.sort_order}
                                                    onChange={(event) => updateLevel(index, 'sort_order', Number(event.target.value))}
                                                />
                                                <InputError message={errors[`levels.${index}.sort_order`]} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`levels.${index}.min_percent`}>Minimum %</Label>
                                                <Input
                                                    id={`levels.${index}.min_percent`}
                                                    type="number"
                                                    value={level.min_percent ?? ''}
                                                    onChange={(event) =>
                                                        updateLevel(index, 'min_percent', event.target.value === '' ? null : Number(event.target.value))
                                                    }
                                                />
                                                <InputError message={errors[`levels.${index}.min_percent`]} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`levels.${index}.max_percent`}>Maximum %</Label>
                                                <Input
                                                    id={`levels.${index}.max_percent`}
                                                    type="number"
                                                    value={level.max_percent ?? ''}
                                                    onChange={(event) =>
                                                        updateLevel(index, 'max_percent', event.target.value === '' ? null : Number(event.target.value))
                                                    }
                                                />
                                                <InputError message={errors[`levels.${index}.max_percent`]} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`levels.${index}.color`}>Color Token</Label>
                                                <Input
                                                    id={`levels.${index}.color`}
                                                    value={level.color}
                                                    onChange={(event) => updateLevel(index, 'color', event.target.value)}
                                                />
                                                <InputError message={errors[`levels.${index}.color`]} />
                                            </div>

                                            <div className="flex items-end">
                                                <div className="flex w-full items-center justify-between rounded-lg border bg-background px-4 py-2.5">
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">Default level</p>
                                                        <p className="text-xs text-muted-foreground">Used as the initial selection</p>
                                                    </div>

                                                    <Checkbox checked={level.is_default} onCheckedChange={() => setDefaultLevel(index)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <CardTitle className="text-lg">Lifecycle & Status</CardTitle>
                                        <CardDescription>
                                            Maintain whether this scale stays available for templates and scoring flows.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Active Status</p>
                                        <p className="text-xs text-muted-foreground">
                                            Should this scale remain available for assignment and score mapping?
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked === true)}
                                        />
                                        <span className="text-sm font-medium text-foreground">
                                            {data.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12 space-y-6 lg:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-base">Scoring Insight</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p className="leading-6">
                                    Scale revisions can affect downstream score mapping, so keep level ordering and percentage ranges stable where possible.
                                </p>

                                <div className="flex items-start gap-3 rounded-lg border bg-muted/10 p-3">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p className="text-xs leading-5">
                                        If you change numeric values or range bands, verify how the scale is used by templates before finalizing the edit.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Current Record</CardTitle>
                                <CardDescription>Operational context for this scale definition.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">{ratingScale.id}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Record ID</span>
                                    </div>
                                    <PencilLine className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">{data.levels.length}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Level Count</span>
                                    </div>
                                    <Layers3 className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div>
                                    <span className="block text-2xl font-bold text-foreground">
                                        {data.is_active ? 'Live' : 'Paused'}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Lifecycle</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-base">Scale Preview</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="h-4 w-3/4 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted/70" />

                                <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">{data.name || 'Scale name'}</p>
                                        <Badge variant="outline">
                                            {typeOptions.find((option) => option.value === data.applies_to)?.label ?? 'Type'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">{data.code || 'Scale code'}</p>
                                    <p className="mt-2 text-[11px] text-muted-foreground">{data.levels.length} configured levels</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Palette className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-base">Type Summary</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="text-sm text-muted-foreground">
                                This scale is configured for{' '}
                                <span className="font-medium text-foreground">
                                    {typeOptions.find((option) => option.value === data.applies_to)?.label ?? 'Unknown'}
                                </span>{' '}
                                scoring.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </PerformancePage>
    );
}
