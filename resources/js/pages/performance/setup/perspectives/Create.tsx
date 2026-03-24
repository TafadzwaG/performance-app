import PerformancePage from '@/components/performance/PerformancePage';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';
import {
    ArrowUpDown,
    Eye,
    FilePenLine,
    Info,
    Layers3,
    Lightbulb,
    Save,
    ShieldCheck,
    Target,
    TrendingUp,
} from 'lucide-react';
import type { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Perspectives', href: route('performance.setup.perspectives.index') },
    { title: 'Create', href: route('performance.setup.perspectives.create') },
];

export default function PerspectiveCreate() {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        code: string;
        description: string;
        sort_order: number;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        description: '',
        sort_order: 1,
        is_active: true,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.setup.perspectives.store'));
    };

    return (
        <PerformancePage
            title="Create Perspective"
            description="Add a strategic perspective that structures appraisal goals and templates."
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
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Perspective</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Define a perspective that organizes objectives, templates, and reporting summaries.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Perspective
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
                                                Capture the name, code, and description for this strategic bucket.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <Badge variant="outline">Required</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Perspective Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            placeholder="e.g. Customer"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Perspective Code</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(event) => setData('code', event.target.value)}
                                            placeholder="e.g. CUST"
                                        />
                                        <InputError message={errors.code} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="description">Description & Intent</Label>
                                        <textarea
                                            id="description"
                                            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            value={data.description}
                                            onChange={(event) => setData('description', event.target.value)}
                                            placeholder="Explain what types of objectives should be grouped under this perspective..."
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
                                            Maintain display order and whether the perspective is available for immediate use.
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
                                            Should this perspective be selectable in templates and appraisals now?
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
                                    Perspectives influence how objectives are grouped in plan, self assessment, and reporting views.
                                    Keep the list focused and intuitive.
                                </p>

                                <div className="flex items-start gap-3 rounded-lg border bg-muted/10 p-3">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p className="text-xs leading-5">
                                        Sort order should reflect the way you want goal sections to appear in appraisal forms and printouts.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Current Draft</CardTitle>
                                <CardDescription>Live context for the perspective you are defining.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">
                                            {data.is_active ? 'Live' : 'Draft'}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Current State</span>
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
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
                                        {data.description.trim().length}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Description Characters</span>
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
                                    <p className="text-sm font-semibold text-foreground">{data.name || 'Draft perspective name'}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{data.code || 'Draft perspective code'}</p>
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
                                Active perspectives become available immediately in template builders and appraisal planning views.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </PerformancePage>
    );
}
