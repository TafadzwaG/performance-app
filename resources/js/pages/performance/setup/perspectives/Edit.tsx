import PerformancePage from '@/components/performance/PerformancePage';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import type { Perspective } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import {
    ArrowUpDown,
    Eye,
    FilePenLine,
    Info,
    Layers3,
    Lightbulb,
    PencilLine,
    Save,
    Target,
    TrendingUp,
} from 'lucide-react';
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
        <PerformancePage
            title="Edit Perspective"
            description="Update the perspective definition, ordering, and active state."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Strategic framework
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Perspective</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Maintain the structural perspective used across goals, templates, and reporting summaries.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                Update Perspective
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
                                            <CardTitle className="text-lg">Identity & Classification</CardTitle>
                                            <CardDescription>
                                                Maintain the naming and descriptive structure of this perspective.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <Badge variant="outline">Editable</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Perspective Name</Label>
                                        <Input id="name" value={data.name} onChange={(event) => setData('name', event.target.value)} />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Perspective Code</Label>
                                        <Input id="code" value={data.code} onChange={(event) => setData('code', event.target.value)} />
                                        <InputError message={errors.code} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="description">Description & Intent</Label>
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
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                        <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <CardTitle className="text-lg">Order & Lifecycle</CardTitle>
                                        <CardDescription>
                                            Maintain display order and whether this perspective remains active.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="sort_order">Sort Order</Label>
                                        <Input
                                            id="sort_order"
                                            type="number"
                                            value={data.sort_order}
                                            onChange={(event) => setData('sort_order', Number(event.target.value))}
                                        />
                                        <InputError message={errors.sort_order} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Active Status</p>
                                        <p className="text-xs text-muted-foreground">
                                            Should this perspective remain selectable in templates and appraisals?
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
                                    <CardTitle className="text-base">Planning Insight</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p className="leading-6">
                                    Perspective order and naming shape the user experience in goal planning and final review summaries.
                                </p>

                                <div className="flex items-start gap-3 rounded-lg border bg-muted/10 p-3">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p className="text-xs leading-5">
                                        Changing order can affect how managers interpret the structure of an appraisal form, so keep edits deliberate.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Current Record</CardTitle>
                                <CardDescription>Operational context for this perspective entry.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">{perspective.id}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Record ID</span>
                                    </div>
                                    <PencilLine className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">{data.sort_order}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Display Order</span>
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
                                    <CardTitle className="text-base">Registry Preview</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="h-4 w-3/4 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted/70" />

                                <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                                    <p className="text-sm font-semibold text-foreground">{data.name || 'Perspective name'}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{data.code || 'Perspective code'}</p>
                                    <p className="mt-2 text-[11px] text-muted-foreground">Sort order {data.sort_order || 0}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Target className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-base">Usage Readiness</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="text-sm text-muted-foreground">
                                Active perspectives remain available for template sections, objective grouping, and print summaries.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </PerformancePage>
    );
}
