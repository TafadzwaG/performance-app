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
import type { Competency, Option } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import {
    Eye,
    FilePenLine,
    Gauge,
    Info,
    Lightbulb,
    Network,
    PencilLine,
    Save,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
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

const categoryOptions = [
    { value: 'competency', label: 'Competency' },
    { value: 'value', label: 'Value' },
    { value: 'behaviour', label: 'Behaviour' },
];

function scopeSummary(data: CompetencyForm) {
    if (data.department_id && data.job_title_id) return 'Department + Job Title scoped';
    if (data.department_id) return 'Department scoped';
    if (data.job_title_id) return 'Job Title scoped';
    return 'Global catalogue entry';
}

export default function CompetencyEdit({ competency, departmentOptions, jobTitleOptions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Values', href: route('performance.setup.competencies.index') },
        { title: competency.name, href: route('performance.setup.competencies.show', competency.id) },
        { title: 'Edit', href: route('performance.setup.competencies.edit', competency.id) },
    ];

    const { data, setData, put, processing, errors } = useForm<CompetencyForm>({
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
        <PerformancePage
            title="Edit Value"
            description="Update value metadata, scope, and lifecycle state."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Behaviour framework
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Value</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Maintain the definition, scope, and active status of this value entry.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                Update Value
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
                                                Maintain the core naming, code, and category of this entry.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <Badge variant="outline">Editable</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Value Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Value Code</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(event) => setData('code', event.target.value)}
                                        />
                                        <InputError message={errors.code} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select value={data.category} onValueChange={(value) => setData('category', value)}>
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Choose category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categoryOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.category} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="description">Description & Behavioural Expectation</Label>
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
                                        <Network className="h-5 w-5 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <CardTitle className="text-lg">Scope & Applicability</CardTitle>
                                        <CardDescription>
                                            Adjust whether this value is general, departmental, or role-specific.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="department_id">Department Scope</Label>
                                        <Select value={data.department_id || '__all__'} onValueChange={(value) => setData('department_id', value === '__all__' ? '' : value)}>
                                            <SelectTrigger id="department_id">
                                                <SelectValue placeholder="All departments" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">All departments</SelectItem>
                                                {departmentOptions.map((option) => (
                                                    <SelectItem key={String(option.value)} value={String(option.value)}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.department_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="job_title_id">Job Title Scope</Label>
                                        <Select value={data.job_title_id || '__all__'} onValueChange={(value) => setData('job_title_id', value === '__all__' ? '' : value)}>
                                            <SelectTrigger id="job_title_id">
                                                <SelectValue placeholder="All job titles" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">All job titles</SelectItem>
                                                {jobTitleOptions.map((option) => (
                                                    <SelectItem key={String(option.value)} value={String(option.value)}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.job_title_id} />
                                    </div>
                                </div>
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
                                            Maintain whether this entry remains available in templates and appraisals.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Active Status</p>
                                        <p className="text-xs text-muted-foreground">
                                            Should this competency remain available for scoring and evaluation?
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
                                    <CardTitle className="text-base">Framework Insight</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p className="leading-6">
                                    Stable competency definitions make manager ratings easier to calibrate and keep development discussions grounded in shared expectations.
                                </p>

                                <div className="flex items-start gap-3 rounded-lg border bg-muted/10 p-3">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p className="text-xs leading-5">
                                        Be cautious when changing scope. A previously global competency made role-specific can change how templates should reference it.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Current Record</CardTitle>
                                <CardDescription>Operational context for this competency entry.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">{competency.id}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Record ID</span>
                                    </div>
                                    <PencilLine className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">
                                            {data.is_active ? 'Live' : 'Paused'}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Lifecycle</span>
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div>
                                    <span className="block text-2xl font-bold text-foreground">
                                        {data.code ? data.code.split('-').filter(Boolean).length : 0}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Code Segments</span>
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
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">{data.name || 'Value name'}</p>
                                        <Badge variant="outline">
                                            {categoryOptions.find((option) => option.value === data.category)?.label ?? 'Category'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">{data.code || 'Value code'}</p>
                                    <p className="mt-2 text-[11px] text-muted-foreground">{scopeSummary(data)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-base">Scope Summary</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="text-sm text-muted-foreground">{scopeSummary(data)}</CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </PerformancePage>
    );
}
