import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { Option } from '@/types/performance';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    Activity,
    Briefcase,
    Building2,
    ClipboardList,
    FileText,
    Gauge,
    Layers3,
    Save,
    Target,
} from 'lucide-react';

interface Props {
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    perspectiveOptions: Option[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Goal Library', href: route('performance.goal_library.index') },
    { title: 'Create', href: route('performance.goal_library.create') },
];

export default function GoalLibraryCreate({
    departmentOptions,
    jobTitleOptions,
    perspectiveOptions,
}: Props) {
    const { data, setData, post, processing } = useForm({
        department_id: '',
        job_title_id: '',
        perspective_id: '',
        title: '',
        description: '',
        kpi_measure: '',
        target_definition: '',
        default_weight: 25,
        evidence_source: '',
        timeline_days: 90,
        is_active: true,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.goal_library.store'));
    };

    const selectedDepartment =
        departmentOptions.find((option) => String(option.value) === String(data.department_id))?.label ?? 'Not selected';

    const selectedJobTitle =
        jobTitleOptions.find((option) => String(option.value) === String(data.job_title_id))?.label ?? 'Any job title';

    const selectedPerspective =
        perspectiveOptions.find((option) => String(option.value) === String(data.perspective_id))?.label ??
        'Not selected';

    return (
        <PerformancePage
            title="Create Goal Library Item"
            description="Add a reusable SMART objective."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Goal library setup
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Create Goal Library Item
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Add a reusable SMART goal template with strategic alignment, measurement details,
                                    and target definitions for future planning cycles.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Departments</div>
                                <div className="mt-1 font-semibold text-foreground">{departmentOptions.length}</div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Job titles</div>
                                <div className="mt-1 font-semibold text-foreground">{jobTitleOptions.length}</div>
                            </div>

                            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">Perspectives</div>
                                <div className="mt-1 font-semibold text-foreground">{perspectiveOptions.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers3 className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Strategic Alignment</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Connect the goal to a department, job title scope, and strategic perspective.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Gauge className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">Measurement Logic</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Define KPI measures, evidence sources, weights, and timelines clearly.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4.5 w-4.5" />
                                <CardTitle className="text-sm font-medium">SMART Definition</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Capture the objective description and a precise target definition for reuse.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <Card className="shadow-sm xl:col-span-8">
                        <CardHeader className="border-b bg-muted/20">
                            <div>
                                <CardTitle className="text-lg">Goal Library Form</CardTitle>
                                <CardDescription>
                                    Complete the sections below to add a reusable goal into the library.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            <form onSubmit={submit} className="space-y-8">
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Identity</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Core alignment and ownership context
                                        </span>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Goal Title
                                            </label>
                                            <Input
                                                value={data.title}
                                                onChange={(event) => setData('title', event.target.value)}
                                                placeholder="e.g. Quarterly Revenue Expansion"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Strategic Perspective
                                            </label>
                                            <select
                                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.perspective_id}
                                                onChange={(event) => setData('perspective_id', event.target.value)}
                                            >
                                                <option value="">Select perspective</option>
                                                {perspectiveOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Department
                                            </label>
                                            <select
                                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.department_id}
                                                onChange={(event) => setData('department_id', event.target.value)}
                                            >
                                                <option value="">Select department</option>
                                                {departmentOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Job Title Alignment
                                            </label>
                                            <select
                                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.job_title_id}
                                                onChange={(event) => setData('job_title_id', event.target.value)}
                                            >
                                                <option value="">Any job title</option>
                                                {jobTitleOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Metrics</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Measurement and evidence configuration
                                        </span>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                KPI / Measure
                                            </label>
                                            <Input
                                                value={data.kpi_measure}
                                                onChange={(event) => setData('kpi_measure', event.target.value)}
                                                placeholder="Total revenue in USD"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Evidence Source
                                            </label>
                                            <Input
                                                value={data.evidence_source}
                                                onChange={(event) => setData('evidence_source', event.target.value)}
                                                placeholder="Salesforce CRM Report Q4"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Default Weight (%)
                                            </label>
                                            <Input
                                                type="number"
                                                value={data.default_weight}
                                                onChange={(event) =>
                                                    setData('default_weight', Number(event.target.value))
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Timeline (Days)
                                            </label>
                                            <Input
                                                type="number"
                                                value={data.timeline_days}
                                                onChange={(event) =>
                                                    setData('timeline_days', Number(event.target.value))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Description</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Narrative definition and success criteria
                                        </span>
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Description
                                            </label>
                                            <textarea
                                                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.description}
                                                onChange={(event) => setData('description', event.target.value)}
                                                placeholder="Describe the strategic intent of this goal..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Target Definition
                                            </label>
                                            <textarea
                                                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.target_definition}
                                                onChange={(event) => setData('target_definition', event.target.value)}
                                                placeholder="What does success look like? Provide specific thresholds..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <Activity className="mt-0.5 h-4 w-4 shrink-0" />
                                        <p>
                                            Saving this item will add it to the reusable goal catalog with the current
                                            alignment, measurement, and target settings.
                                        </p>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Goal
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-6 xl:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Selection Summary</CardTitle>
                                <CardDescription>
                                    Review the current alignment before saving the goal item.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        <Layers3 className="h-3.5 w-3.5" />
                                        Perspective
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {selectedPerspective}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        <Building2 className="h-3.5 w-3.5" />
                                        Department
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {selectedDepartment}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                        <Briefcase className="h-3.5 w-3.5" />
                                        Job Title Alignment
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-foreground">
                                        {selectedJobTitle}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">SMART Notes</CardTitle>
                                <CardDescription>
                                    Keep the goal reusable, measurable, and easy to apply in future cycles.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Use a clear title that describes the outcome, not just the activity.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Prefer measurable KPIs and concrete evidence sources for easier tracking.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Define success with specific thresholds, deadlines, or expected deliverables.
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Coverage</CardTitle>
                                <CardDescription>Available configuration options in this setup.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Departments</span>
                                    <span className="font-medium text-foreground">{departmentOptions.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Job titles</span>
                                    <span className="font-medium text-foreground">{jobTitleOptions.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Perspectives</span>
                                    <span className="font-medium text-foreground">{perspectiveOptions.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                                    <span className="text-muted-foreground">Active state</span>
                                    <span className="font-medium text-foreground">
                                        {data.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ClipboardList className="h-4.5 w-4.5" />
                                    <CardTitle className="text-sm font-medium">Goal Health</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-foreground">
                                    {String(data.default_weight)}%
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Current default weight configured for this library goal item.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PerformancePage>
    );
}