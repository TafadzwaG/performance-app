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
import type { FormEvent } from 'react';
import {
    Briefcase,
    Eye,
    Info,
    Lightbulb,
    Save,
    ShieldCheck,
    TrendingUp,
    FilePenLine,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Job Titles', href: route('performance.setup.job_titles.index') },
    { title: 'Create', href: route('performance.setup.job_titles.create') },
];

export default function JobTitleCreate() {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        code: string;
        description: string;
        is_active: boolean;
    }>({
        name: '',
        code: '',
        description: '',
        is_active: true,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.setup.job_titles.store'));
    };

    return (
        <PerformancePage
            title="Create Job Title"
            description="Add a job title for employee setup and templates."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Job architecture
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Create Job Title
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Define the structural requirements for a new organizational role.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Job Title
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
                                                Capture the core naming and descriptive context for this role.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <Badge variant="outline">Required</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Job Title Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            placeholder="e.g. Senior Software Architect"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Role Code</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(event) => setData('code', event.target.value)}
                                            placeholder="e.g. TECH-SR-01"
                                        />
                                        <InputError message={errors.code} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="description">Description & Responsibilities</Label>
                                        <textarea
                                            id="description"
                                            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                            value={data.description}
                                            onChange={(event) => setData('description', event.target.value)}
                                            placeholder="Briefly describe the key objectives and scope of this role..."
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
                                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <CardTitle className="text-lg">Lifecycle & Status</CardTitle>
                                        <CardDescription>
                                            Control whether this role is available for immediate assignment.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Active Status</p>
                                        <p className="text-xs text-muted-foreground">
                                            Should this role be available for immediate assignment?
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
                                    <CardTitle className="text-base">Architect Insight</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p className="leading-6">
                                    Standardizing job titles helps keep employee setup, reporting structures, and
                                    performance workflows consistent across the organization.
                                </p>

                                <div className="flex items-start gap-3 rounded-lg border bg-muted/10 p-3">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p className="text-xs leading-5">
                                        Codes should be unique. A hierarchical naming convention like
                                        <span className="font-medium text-foreground"> DEPT-LEVEL-ID</span> keeps the
                                        architecture easier to manage.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Current Architecture</CardTitle>
                                <CardDescription>Live context for the draft you are creating.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">
                                            {data.is_active ? 'Live' : 'Draft'}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                            Current State
                                        </span>
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div className="flex items-end justify-between border-b pb-4">
                                    <div>
                                        <span className="block text-2xl font-bold text-foreground">
                                            {data.code ? data.code.split('-').filter(Boolean).length : 0}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                            Code Segments
                                        </span>
                                    </div>
                                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div>
                                    <span className="block text-2xl font-bold text-foreground">
                                        {data.description.trim().length}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                        Description Characters
                                    </span>
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
                                    <p className="text-sm font-semibold text-foreground">
                                        {data.name || 'Draft role title'}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {data.code || 'Draft role code'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </PerformancePage>
    );
}