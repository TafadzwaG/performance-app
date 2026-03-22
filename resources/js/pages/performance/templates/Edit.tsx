import PerformancePage from '@/components/performance/PerformancePage';
import TemplateItemBuilder from '@/components/performance/TemplateItemBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import type { Option, Template, TemplateItem } from '@/types/performance';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

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

    return (
        <PerformancePage title="Edit Template" description="Update template metadata, scales, and template items." breadcrumbs={breadcrumbs}>
            <Card>
                <CardContent className="space-y-4 p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.name} onChange={(event) => setData('name', event.target.value)} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" value={data.code} onChange={(event) => setData('code', event.target.value)} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.version} onChange={(event) => setData('version', Number(event.target.value))} />
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
                            <select
                                className="rounded-md border bg-background px-3 py-2 text-sm"
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
                            <select
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                                value={data.competency_rating_scale_id}
                                onChange={(event) => setData('competency_rating_scale_id', event.target.value)}
                            >
                                <option value="">Competency scale</option>
                                {props.competencyScaleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="rounded-md border bg-background px-3 py-2 text-sm"
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
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.business_weight_percent} onChange={(event) => setData('business_weight_percent', Number(event.target.value))} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.values_weight_percent} onChange={(event) => setData('values_weight_percent', Number(event.target.value))} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.min_objectives} onChange={(event) => setData('min_objectives', Number(event.target.value))} />
                            <input className="rounded-md border bg-background px-3 py-2 text-sm" type="number" value={data.max_objectives} onChange={(event) => setData('max_objectives', Number(event.target.value))} />
                        </div>
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
                        <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={data.description} onChange={(event) => setData('description', event.target.value)} />
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
