import PerformancePage from '@/components/performance/PerformancePage';
import TemplateItemBuilder from '@/components/performance/TemplateItemBuilder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { Option, Template, TemplateItem } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    BarChart3,
    CheckCircle2,
    ClipboardList,
    FileText,
    Info,
    Layers3,
    Save,
    Settings2,
    SlidersHorizontal,
    Sparkles,
    Weight,
} from 'lucide-react';

interface Props {
    template: Template;
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    objectiveScaleOptions: Option[];
    competencyScaleOptions: Option[];
    overallScaleOptions: Option[];
    perspectiveOptions: Option[];
    competencyOptions: Option[];
}

interface TemplateItemForm {
    id?: number;
    appraisal_template_id?: number;
    item_type: string;
    perspective_id?: number | null;
    competency_id?: number | null;
    title: string;
    description?: string | null;
    default_weight?: number | null;
    evidence_source_hint?: string | null;
    sort_order: number;
    is_required: boolean;
    [key: string]: FormDataConvertible;
}

interface TemplateForm {
    name: string;
    code: string;
    version: number;
    description: string;
    department_id: string;
    job_title_id: string;
    objective_rating_scale_id: string;
    competency_rating_scale_id: string;
    overall_rating_scale_id: string;
    business_weight_percent: number;
    values_weight_percent: number;
    min_objectives: number;
    max_objectives: number;
    allow_competencies: boolean;
    is_active: boolean;
    items: TemplateItemForm[];
    [key: string]: FormDataConvertible;
}

const mapTemplateItem = (item: TemplateItem): TemplateItemForm => ({
    id: item.id,
    appraisal_template_id: item.appraisal_template_id,
    item_type: item.item_type,
    perspective_id: item.perspective_id ?? null,
    competency_id: item.competency_id ?? null,
    title: item.title,
    description: item.description ?? '',
    default_weight: item.default_weight ?? null,
    evidence_source_hint: item.evidence_source_hint ?? '',
    sort_order: item.sort_order,
    is_required: item.is_required,
});

export default function TemplateEdit(props: Props) {
    const { template } = props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Performance', href: '/performance/dashboard' },
        { title: 'Templates', href: route('performance.templates.index') },
        { title: template.name, href: route('performance.templates.show', template.id) },
        { title: 'Edit', href: route('performance.templates.edit', template.id) },
    ];

    const { data, setData, put, processing } = useForm<TemplateForm>({
        name: template.name,
        code: template.code,
        version: template.version,
        description: template.description ?? '',
        department_id: template.department_id ? String(template.department_id) : '',
        job_title_id: template.job_title_id ? String(template.job_title_id) : '',
        objective_rating_scale_id: template.objective_rating_scale_id ? String(template.objective_rating_scale_id) : '',
        competency_rating_scale_id: template.competency_rating_scale_id ? String(template.competency_rating_scale_id) : '',
        overall_rating_scale_id: template.overall_rating_scale_id ? String(template.overall_rating_scale_id) : '',
        business_weight_percent: template.business_weight_percent,
        values_weight_percent: template.values_weight_percent,
        min_objectives: template.min_objectives,
        max_objectives: template.max_objectives,
        allow_competencies: template.allow_competencies,
        is_active: template.is_active,
        items: (template.items ?? []).map(mapTemplateItem),
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('performance.templates.update', template.id));
    };

    const allocatedWeight = Number(data.business_weight_percent || 0) + Number(data.values_weight_percent || 0);
    const remainingWeight = Math.max(0, 100 - allocatedWeight);

    return (
        <PerformancePage
            title="Edit Template"
            description="Update template metadata, scales, and template items."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Badge variant="secondary" className="w-fit">
                                Template editor
                            </Badge>

                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Template</h1>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Update core metadata, rating configuration, weighting balance, and template items
                                    in one structured workspace.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Template
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                    <div className="space-y-6 xl:col-span-8">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <Info className="h-4.5 w-4.5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-lg">Core Metadata</CardTitle>
                                        <CardDescription>
                                            Define the template identity and assignment scope.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 p-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Template Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            placeholder="Template name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Template Code</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(event) => setData('code', event.target.value)}
                                            placeholder="Template code"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="version">Version</Label>
                                        <Input
                                            id="version"
                                            type="number"
                                            value={data.version}
                                            onChange={(event) => setData('version', Number(event.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department_id">Department</Label>
                                        <select
                                            id="department_id"
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.department_id}
                                            onChange={(event) => setData('department_id', event.target.value)}
                                        >
                                            <option value="">Department</option>
                                            {props.departmentOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="job_title_id">Job Title</Label>
                                        <select
                                            id="job_title_id"
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.job_title_id}
                                            onChange={(event) => setData('job_title_id', event.target.value)}
                                        >
                                            <option value="">Job title</option>
                                            {props.jobTitleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={data.description}
                                            onChange={(event) => setData('description', event.target.value)}
                                            placeholder="Short template summary"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <Settings2 className="h-4.5 w-4.5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-lg">Rating Configuration</CardTitle>
                                        <CardDescription>
                                            Select the rating scales and objective boundaries used by this template.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 p-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="objective_rating_scale_id">Objective Scale</Label>
                                        <select
                                            id="objective_rating_scale_id"
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.objective_rating_scale_id}
                                            onChange={(event) => setData('objective_rating_scale_id', event.target.value)}
                                        >
                                            <option value="">Objective scale</option>
                                            {props.objectiveScaleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="competency_rating_scale_id">Values Scale</Label>
                                        <select
                                            id="competency_rating_scale_id"
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.competency_rating_scale_id}
                                            onChange={(event) =>
                                                setData('competency_rating_scale_id', event.target.value)
                                            }
                                        >
                                            <option value="">Values scale</option>
                                            {props.competencyScaleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="overall_rating_scale_id">Overall Logic</Label>
                                        <select
                                            id="overall_rating_scale_id"
                                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.overall_rating_scale_id}
                                            onChange={(event) => setData('overall_rating_scale_id', event.target.value)}
                                        >
                                            <option value="">Overall scale</option>
                                            {props.overallScaleOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="min_objectives">Minimum Objectives</Label>
                                        <Input
                                            id="min_objectives"
                                            type="number"
                                            value={data.min_objectives}
                                            onChange={(event) => setData('min_objectives', Number(event.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max_objectives">Maximum Objectives</Label>
                                        <Input
                                            id="max_objectives"
                                            type="number"
                                            value={data.max_objectives}
                                            onChange={(event) => setData('max_objectives', Number(event.target.value))}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-start space-x-3 rounded-lg border bg-muted/20 p-4">
                                        <Checkbox
                                            id="allow_competencies"
                                            checked={data.allow_competencies}
                                            onCheckedChange={(checked) =>
                                                setData('allow_competencies', checked === true)
                                            }
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="allow_competencies" className="font-medium">
                                                Allow competency section
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Enable competency or behavioral items in this template.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3 rounded-lg border bg-muted/20 p-4">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked === true)}
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="is_active" className="font-medium">
                                                Active template
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Mark this template available for active appraisal use.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 xl:col-span-4">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <Weight className="h-4.5 w-4.5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-lg">Weighting Balance</CardTitle>
                                        <CardDescription>
                                            Control the split between business KPIs and values.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 p-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="business_weight_percent">Business KPIs</Label>
                                        <span className="text-lg font-semibold text-foreground">
                                            {data.business_weight_percent}%
                                        </span>
                                    </div>
                                    <Input
                                        id="business_weight_percent"
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={data.business_weight_percent}
                                        onChange={(event) =>
                                            setData('business_weight_percent', Number(event.target.value))
                                        }
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="values_weight_percent">Behavioral / Values</Label>
                                        <span className="text-lg font-semibold text-foreground">
                                            {data.values_weight_percent}%
                                        </span>
                                    </div>
                                    <Input
                                        id="values_weight_percent"
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={data.values_weight_percent}
                                        onChange={(event) =>
                                            setData('values_weight_percent', Number(event.target.value))
                                        }
                                    />
                                </div>

                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <p className="text-sm text-muted-foreground">
                                        Keep the balance aligned with the template’s intended evaluation model.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Weight Summary</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                    <span className="text-sm text-muted-foreground">Allocated</span>
                                    <span className="font-semibold text-foreground">{allocatedWeight}%</span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
                                    <span className="text-sm text-muted-foreground">Remaining</span>
                                    <span className="font-semibold text-foreground">{remainingWeight}%</span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full bg-foreground"
                                        style={{ width: `${Math.min(allocatedWeight, 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4.5 w-4.5 text-muted-foreground" />
                                    <CardTitle className="text-lg">Quick Notes</CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Business and values weights should align with your appraisal policy.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Item configuration remains below and uses the same builder flow.
                                </div>
                                <div className="rounded-lg border bg-muted/20 p-3">
                                    Saving will preserve metadata, scales, switches, and template items together.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-lg">Template Item Builder</CardTitle>
                                    <CardDescription>
                                        Add and organize business KPI and behavioral items.
                                    </CardDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>{data.items.length} configured item(s)</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        <TemplateItemBuilder
                            items={data.items}
                            perspectiveOptions={props.perspectiveOptions}
                            competencyOptions={props.competencyOptions}
                            onChange={(items) => setData('items', items as TemplateItemForm[])}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Template
                    </Button>
                </div>
            </form>
        </PerformancePage>
    );
}