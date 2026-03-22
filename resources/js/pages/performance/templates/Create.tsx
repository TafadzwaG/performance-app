import PerformancePage from '@/components/performance/PerformancePage';
import TemplateItemBuilder from '@/components/performance/TemplateItemBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Option, TemplateItem } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Props {
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Templates', href: route('performance.templates.index') },
    { title: 'Create', href: route('performance.templates.create') },
];

export default function TemplateCreate(props: Props) {
    const { data, setData, post, processing } = useForm<TemplateForm>({
        name: '',
        code: '',
        version: 1,
        description: '',
        department_id: '',
        job_title_id: '',
        objective_rating_scale_id: '',
        competency_rating_scale_id: '',
        overall_rating_scale_id: '',
        business_weight_percent: 80,
        values_weight_percent: 20,
        min_objectives: 4,
        max_objectives: 6,
        allow_competencies: true,
        is_active: true,
        items: [] as TemplateItemForm[],
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('performance.templates.store'));
    };

    return (
        <PerformancePage title="Create Template" description="Create template metadata, scales, and template items." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.name} onChange={(event) => setData('name', event.target.value)} placeholder="Name" />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.code} onChange={(event) => setData('code', event.target.value)} placeholder="Code" />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.version} onChange={(event) => setData('version', Number(event.target.value))} placeholder="Version" />
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.department_id} onChange={(event) => setData('department_id', event.target.value)}>
                                <option value="">Department</option>
                                {props.departmentOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.job_title_id} onChange={(event) => setData('job_title_id', event.target.value)}>
                                <option value="">Job title</option>
                                {props.jobTitleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.objective_rating_scale_id} onChange={(event) => setData('objective_rating_scale_id', event.target.value)}>
                                <option value="">Objective scale</option>
                                {props.objectiveScaleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.competency_rating_scale_id} onChange={(event) => setData('competency_rating_scale_id', event.target.value)}>
                                <option value="">Competency scale</option>
                                {props.competencyScaleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={data.overall_rating_scale_id} onChange={(event) => setData('overall_rating_scale_id', event.target.value)}>
                                <option value="">Overall scale</option>
                                {props.overallScaleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.business_weight_percent} onChange={(event) => setData('business_weight_percent', Number(event.target.value))} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.values_weight_percent} onChange={(event) => setData('values_weight_percent', Number(event.target.value))} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.min_objectives} onChange={(event) => setData('min_objectives', Number(event.target.value))} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.max_objectives} onChange={(event) => setData('max_objectives', Number(event.target.value))} />
                        </div>
                        <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={data.description} onChange={(event) => setData('description', event.target.value)} placeholder="Description" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={data.allow_competencies} onChange={(event) => setData('allow_competencies', event.target.checked)} />
                                Allow competency section
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={data.is_active} onChange={(event) => setData('is_active', event.target.checked)} />
                                Active template
                            </label>
                        </div>
                        <TemplateItemBuilder
                            items={data.items}
                            perspectiveOptions={props.perspectiveOptions}
                            competencyOptions={props.competencyOptions}
                            onChange={(items) => setData('items', items as TemplateItemForm[])}
                        />
                        <Button type="submit" disabled={processing}>
                            Save Template
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </PerformancePage>
    );
}
